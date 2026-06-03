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

const membersCollection = collection(db, "members");
const transactionsCollection = collection(db, "transactions");

let members = [];
let filteredMembers = [];

let currentPage = 1;
const rowsPerPage = 10;

let editingId = null;

/* ==========================
AUTH SAFE CHECK
========================== */

function requireAuth() {
  const user = auth.currentUser;
  if (!user) {
    alert("You are not logged in or session expired.");
    return null;
  }
  return user;
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
TOTAL MEMBERS
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

  filteredMembers = members.filter(member =>
    (member.fullName || "").toLowerCase().includes(keyword) ||
    (member.phone || "").includes(keyword) ||
    (member.nid || "").includes(keyword)
  );

  currentPage = 1;
  renderTable();
};

/* ==========================
TABLE RENDER
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
PAGE INFO
========================== */

function updatePageInfo() {

  const el = document.getElementById("pageInfo");
  if (!el) return;

  const totalPages =
    Math.ceil(filteredMembers.length / rowsPerPage) || 1;

  el.textContent = `Page ${currentPage} of ${totalPages}`;
}

/* ==========================
PAGINATION
========================== */

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
OPEN ADD MODAL
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
EDIT MEMBER
========================== */

window.editMember = async function (memberId) {

  const user = requireAuth();
  if (!user) return;

  try {

    const memberRef = doc(db, "members", memberId);
    const memberSnap = await getDoc(memberRef);

    if (!memberSnap.exists()) return;

    const member = memberSnap.data();

    editingId = memberId;

    document.getElementById("modalTitle").textContent = "Edit Member";
    document.getElementById("memberId").value = memberId;
    document.getElementById("fullName").value = member.fullName || "";
    document.getElementById("phone").value = member.phone || "";
    document.getElementById("nid").value = member.nid || "";
    document.getElementById("status").value = member.status || "Active";

    document.getElementById("memberModal").style.display = "flex";

  } catch (error) {
    console.error(error);
    alert(error.message);
  }
};

/* ==========================
SAVE MEMBER (FIXED)
========================== */

window.saveMember = async function () {

  const user = requireAuth();
  if (!user) return;

  try {

    const fullName = document.getElementById("fullName").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const nid = document.getElementById("nid").value.trim();
    const status = document.getElementById("status").value;

    if (!fullName) return alert("Full Name required");
    if (!/^\d{9}$/.test(phone)) return alert("Phone must be 9 digits");
    if (!/^\d{16}$/.test(nid)) return alert("NID must be 16 digits");

    /* DUPLICATE CHECK */
    const phoneSnap = await getDocs(query(membersCollection, where("phone", "==", phone)));
    let phoneExists = false;

    phoneSnap.forEach(d => {
      if (d.id !== editingId) phoneExists = true;
    });

    if (phoneExists) return alert("Phone already exists");

    const nidSnap = await getDocs(query(membersCollection, where("nid", "==", nid)));
    let nidExists = false;

    nidSnap.forEach(d => {
      if (d.id !== editingId) nidExists = true;
    });

    if (nidExists) return alert("NID already exists");

    const createdBy = user.displayName || user.email || "Admin";

    if (!editingId) {

      await addDoc(membersCollection, {
        fullName,
        phone,
        nid,
        status,
        createdAt: serverTimestamp(),
        createdBy,
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

  } catch (error) {
    console.error(error);
    alert(error.message);
  }
};

/* ==========================
DELETE MEMBER
========================== */

window.deleteMemberConfirm = async function (memberId) {

  const user = requireAuth();
  if (!user) return;

  const confirmed = confirm("Delete this member?");
  if (!confirmed) return;

  try {

    const txSnap = await getDocs(
      query(transactionsCollection, where("memberId", "==", memberId))
    );

    if (!txSnap.empty) {
      return alert("Cannot delete: transactions exist");
    }

    await deleteDoc(doc(db, "members", memberId));

  } catch (error) {
    console.error(error);
    alert(error.message);
  }
};

/* ==========================
PROFILE MODAL
========================== */

window.closeProfile = function () {
  document.getElementById("profileModal").style.display = "none";
};

/* ==========================
OPEN PROFILE
========================== */

window.openProfile = async function (memberId) {

  const user = requireAuth();
  if (!user) return;

  try {

    const memberSnap = await getDoc(doc(db, "members", memberId));
    if (!memberSnap.exists()) return;

    const member = memberSnap.data();

    const txSnap = await getDocs(
      query(transactionsCollection, where("memberId", "==", memberId))
    );

    let totalSavings = 0;
    let totalWithdrawals = 0;
    let totalLoans = 0;
    let totalRepayments = 0;

    let rows = "";

    txSnap.forEach(d => {

      const tx = d.data();
      const amount = Number(tx.amount || 0);

      if (tx.type === "saving") totalSavings += amount;
      if (tx.type === "withdrawal") totalWithdrawals += amount;
      if (tx.type === "loan") totalLoans += amount;
      if (tx.type === "repayment") totalRepayments += amount;

    });

    const savingBalance = totalSavings - totalWithdrawals;
    const remainingLoan = totalLoans - totalRepayments;
    const netPosition = savingBalance - remainingLoan;

    document.getElementById("profileContent").innerHTML = `
      <h2>${member.fullName}</h2>
      <p>Net Position: ${netPosition.toLocaleString()}</p>
    `;

    document.getElementById("profileModal").style.display = "flex";

  } catch (error) {
    console.error(error);
    alert(error.message);
  }
};
