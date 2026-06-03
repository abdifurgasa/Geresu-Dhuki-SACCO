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
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================
COLLECTIONS
========================= */

const membersCollection = collection(db, "members");
const transactionsCollection = collection(db, "transactions");

/* =========================
STATE
========================= */

let members = [];
let filteredMembers = [];
let currentPage = 1;
const rowsPerPage = 10;
let editingId = null;

/* =========================
MAKE FUNCTIONS GLOBAL EARLY
(IMPORTANT FIX)
========================= */

window.openAddModal = openAddModal;
window.closeModal = closeModal;
window.saveMember = saveMember;
window.editMember = editMember;
window.deleteMemberConfirm = deleteMemberConfirm;
window.openProfile = openProfile;
window.searchMembers = searchMembers;
window.nextPage = nextPage;
window.prevPage = prevPage;

/* =========================
LOAD MEMBERS REALTIME
========================= */

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

/* =========================
UTILS
========================= */

function getCurrentUserSafe() {
  const user = auth.currentUser;
  if (!user) return null;
  return user;
}

/* =========================
ADD MODAL
========================= */

function openAddModal() {

  editingId = null;

  document.getElementById("memberId").value = "";
  document.getElementById("fullName").value = "";
  document.getElementById("phone").value = "";
  document.getElementById("nid").value = "";
  document.getElementById("status").value = "Active";

  document.getElementById("modalTitle").textContent = "Add Member";

  document.getElementById("memberModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("memberModal").style.display = "none";
}

/* =========================
SAVE MEMBER (FIXED AUTH CHECK)
========================= */

async function saveMember() {

  try {

    const user = getCurrentUserSafe();

    if (!user) {
      alert("Please login again (session expired)");
      return;
    }

    const fullName = document.getElementById("fullName").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const nid = document.getElementById("nid").value.trim();
    const status = document.getElementById("status").value;

    if (!fullName) return alert("Full Name required");
    if (!/^\d{9}$/.test(phone)) return alert("Phone must be 9 digits");
    if (!/^\d{16}$/.test(nid)) return alert("NID must be 16 digits");

    const createdBy = user.email || "System";

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

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

/* =========================
EDIT
========================= */

async function editMember(id) {

  const snap = await getDoc(doc(db, "members", id));

  if (!snap.exists()) return;

  const m = snap.data();

  editingId = id;

  document.getElementById("memberId").value = id;
  document.getElementById("fullName").value = m.fullName || "";
  document.getElementById("phone").value = m.phone || "";
  document.getElementById("nid").value = m.nid || "";
  document.getElementById("status").value = m.status || "Active";

  document.getElementById("modalTitle").textContent = "Edit Member";

  document.getElementById("memberModal").style.display = "flex";
}

/* =========================
DELETE
========================= */

async function deleteMemberConfirm(id) {

  if (!confirm("Delete this member?")) return;

  await deleteDoc(doc(db, "members", id));
}

/* =========================
PROFILE
========================= */

async function openProfile(id) {

  const snap = await getDoc(doc(db, "members", id));
  if (!snap.exists()) return;

  const m = snap.data();

  document.getElementById("profileContent").innerHTML = `
    <h2>${m.fullName}</h2>
    <p>${m.phone}</p>
    <p>${m.nid}</p>
  `;

  document.getElementById("profileModal").style.display = "flex";
}

/* =========================
SEARCH
========================= */

function searchMembers() {

  const keyword = document.getElementById("searchInput").value.toLowerCase();

  filteredMembers = members.filter(m =>
    (m.fullName || "").toLowerCase().includes(keyword) ||
    (m.phone || "").includes(keyword) ||
    (m.nid || "").includes(keyword)
  );

  renderTable();
}

/* =========================
TABLE
========================= */

function renderTable() {

  const tbody = document.getElementById("membersTable");

  if (!tbody) return;

  tbody.innerHTML = "";

  const start = (currentPage - 1) * rowsPerPage;
  const pageData = filteredMembers.slice(start, start + rowsPerPage);

  pageData.forEach(m => {

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${m.fullName || ""}</td>
      <td>${m.phone || ""}</td>
      <td>${m.nid || ""}</td>
      <td>${m.status || ""}</td>
      <td>
        <button onclick="openProfile('${m.id}')">View</button>
        <button onclick="editMember('${m.id}')">Edit</button>
        <button onclick="deleteMemberConfirm('${m.id}')">Delete</button>
      </td>
    `;

    tbody.appendChild(tr);

  });
}

/* =========================
PAGINATION
========================= */

function nextPage() {
  currentPage++;
  renderTable();
}

function prevPage() {
  if (currentPage > 1) currentPage--;
  renderTable();
}

/* =========================
COUNT
========================= */

function updateMembersCount() {
  const el = document.getElementById("totalMembers");
  if (el) el.textContent = members.length;
}
