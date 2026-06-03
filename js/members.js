import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

let currentUser = null;
let authReady = false;

export const authReadyPromise = new Promise((resolve) => {
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    authReady = true;
    resolve(user);
  });
});
import { db, auth } from "./firebase.js";

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* ==========================
AUTH STATE (FIXED)
========================== */

let currentUser = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user || null;
});

/* ==========================
COLLECTIONS
========================== */

const membersCollection = collection(db, "members");
const transactionsCollection = collection(db, "transactions");

/* ==========================
STATE
========================== */

let members = [];
let filteredMembers = [];

let currentPage = 1;
const rowsPerPage = 10;

let editingId = null;

/* ==========================
AUTH GUARD (SAFE)
========================== */

function requireAuth() {
  if (!currentUser) {
    alert("User not ready or session expired. Please refresh and try again.");
    return null;
  }
  return currentUser;
}

/* ==========================
LOAD MEMBERS
========================== */

onSnapshot(membersCollection, (snapshot) => {

  members = [];

  snapshot.forEach((docSnap) => {
    members.push({
      id: docSnap.id,
      ...docSnap.data()
    });
  });

  filteredMembers = [...members];

  updateMembersCount();
  renderTable();

});

/* ==========================
COUNT
========================== */

function updateMembersCount() {
  const el = document.getElementById("totalMembers");
  if (el) el.textContent = members.length;
}

/* ==========================
SEARCH
========================== */

window.searchMembers = function () {

  const keyword = document.getElementById("searchInput")
    .value
    .toLowerCase()
    .trim();

  filteredMembers = members.filter(m =>
    (m.fullName || "").toLowerCase().includes(keyword) ||
    (m.phone || "").includes(keyword) ||
    (m.nid || "").includes(keyword)
  );

  currentPage = 1;
  renderTable();
};

/* ==========================
TABLE
========================== */

function renderTable() {

  const tbody = document.getElementById("membersTable");
  if (!tbody) return;

  tbody.innerHTML = "";

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;

  const pageData = filteredMembers.slice(start, end);

  pageData.forEach(member => {

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${member.fullName || ""}</td>
      <td>${member.phone || ""}</td>
      <td>${member.nid || ""}</td>
      <td><span class="status-badge">${member.status || ""}</span></td>
      <td>${formatDate(member.createdAt)}</td>
      <td>${member.createdBy || "-"}</td>
      <td>
        <button class="table-btn view-btn" onclick="openProfile('${member.id}')">
          <i class="fas fa-eye"></i>
        </button>

        <button class="table-btn edit-btn" onclick="editMember('${member.id}')">
          <i class="fas fa-pen"></i>
        </button>

        <button class="table-btn delete-btn" onclick="deleteMemberConfirm('${member.id}')">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  updatePageInfo();
}

/* ==========================
PAGINATION
========================== */

function updatePageInfo() {

  const el = document.getElementById("pageInfo");
  if (!el) return;

  const totalPages =
    Math.ceil(filteredMembers.length / rowsPerPage) || 1;

  el.textContent = `Page ${currentPage} of ${totalPages}`;
}

window.nextPage = function () {

  const totalPages =
    Math.ceil(filteredMembers.length / rowsPerPage);

  if (currentPage < totalPages) {
    currentPage++;
    renderTable();
  }
};

window.prevPage = function () {

  if (currentPage > 1) {
    currentPage--;
    renderTable();
  }
};

/* ==========================
DATE FORMAT
========================== */

function formatDate(timestamp) {
  if (!timestamp) return "-";

  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toLocaleString();
  }

  return "-";
}

/* ==========================
MODAL
========================== */

window.openAddModal = function () {

  editingId = null;

  document.getElementById("memberId").value = "";
  document.getElementById("fullName").value = "";
  document.getElementById("phone").value = "";
  document.getElementById("nid").value = "";
  document.getElementById("status").value = "Active";

  document.getElementById("modalTitle").textContent = "Add Member";
  document.getElementById("memberModal").style.display = "flex";
};

window.closeModal = function () {
  document.getElementById("memberModal").style.display = "none";
};

/* ==========================
EDIT
========================== */

window.editMember = async function (id) {

  const user = requireAuth();
  if (!user) return;

  const snap = await getDoc(doc(db, "members", id));

  if (!snap.exists()) return;

  const m = snap.data();

  editingId = id;

  document.getElementById("modalTitle").textContent = "Edit Member";

  document.getElementById("memberId").value = id;
  document.getElementById("fullName").value = m.fullName || "";
  document.getElementById("phone").value = m.phone || "";
  document.getElementById("nid").value = m.nid || "";
  document.getElementById("status").value = m.status || "Active";

  document.getElementById("memberModal").style.display = "flex";
};

/* ==========================
SAVE (FIXED AUTH)
========================== */

window.saveMember = async function () {

  // WAIT FOR AUTH FIRST (CRITICAL FIX)
  if (!authReady) {
    await authReadyPromise;
  }

  if (!currentUser) {
    alert("Not logged in. Please login again.");
    return;
  }

  const fullName = document.getElementById("fullName").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const nid = document.getElementById("nid").value.trim();
  const status = document.getElementById("status").value;

  if (!fullName) return alert("Full Name required");
  if (!/^\d{9}$/.test(phone)) return alert("Phone must be 9 digits");
  if (!/^\d{16}$/.test(nid)) return alert("NID must be 16 digits");

  const createdBy = currentUser.displayName || currentUser.email || "Admin";

  if (!editingId) {

    await addDoc(membersCollection, {
      fullName,
      phone,
      nid,
      status,
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

  } else {

    await updateDoc(doc(db, "members", editingId), {
      fullName,
      phone,
      nid,
      status,
      updatedAt: serverTimestamp()
    });

  }

  closeModal();
};

/* ==========================
DELETE
========================== */

window.deleteMemberConfirm = async function (id) {

  const user = requireAuth();
  if (!user) return;

  if (!confirm("Delete this member?")) return;

  const txSnap = await getDocs(
    query(transactionsCollection, where("memberId", "==", id))
  );

  if (!txSnap.empty) {
    return alert("Cannot delete: transactions exist");
  }

  await deleteDoc(doc(db, "members", id));
};

/* ==========================
PROFILE (MINI FIX SAFE)
========================== */

window.openProfile = async function (id) {

  const user = requireAuth();
  if (!user) return;

  const snap = await getDoc(doc(db, "members", id));
  if (!snap.exists()) return;

  const m = snap.data();

  document.getElementById("profileContent").innerHTML = `
    <h2>${m.fullName}</h2>
    <p>${m.phone}</p>
    <p>${m.nid}</p>
  `;

  document.getElementById("profileModal").style.display = "flex";
};

window.closeProfile = function () {
  document.getElementById("profileModal").style.display = "none";
};
