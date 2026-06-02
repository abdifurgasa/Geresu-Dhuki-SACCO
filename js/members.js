// ===============================
// FIREBASE IMPORTS ONLY
// (Firebase must already be initialized elsewhere)
// ===============================

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ⚠️ IMPORTANT:
// This assumes firebase app is already initialized globally
// Example: const db = getFirestore(app);

const db = window.db; // OR replace with your shared db export
const membersRef = collection(db, "members");

// ===============================
// GLOBAL STATE
// ===============================
let members = [];
let currentPage = 1;
const rowsPerPage = 5;

// ===============================
// LOAD MEMBERS
// ===============================
async function loadMembers() {
  const q = query(membersRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  members = [];

  snapshot.forEach((docSnap) => {
    members.push({ id: docSnap.id, ...docSnap.data() });
  });

  renderTable();
}

window.onload = loadMembers;

// ===============================
// RENDER TABLE
// ===============================
function renderTable() {
  const table = document.getElementById("membersTable");
  table.innerHTML = "";

  let start = (currentPage - 1) * rowsPerPage;
  let end = start + rowsPerPage;

  let paginated = members.slice(start, end);

  paginated.forEach((m) => {
    table.innerHTML += `
      <tr>
        <td>${m.fullName}</td>
        <td>${m.phone}</td>
        <td>${m.nid}</td>
        <td>${m.status}</td>
        <td>
          <button onclick="editMember('${m.id}')">Edit</button>
          <button onclick="deleteMember('${m.id}')">Delete</button>
        </td>
      </tr>
    `;
  });

  document.getElementById("pageInfo").innerText = currentPage;
}

// ===============================
// PAGINATION
// ===============================
window.nextPage = function () {
  if (currentPage * rowsPerPage < members.length) {
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

// ===============================
// SEARCH
// ===============================
window.searchMembers = function () {
  const value = document.getElementById("searchInput").value.toLowerCase();

  const filtered = members.filter((m) =>
    m.fullName.toLowerCase().includes(value) ||
    m.phone.includes(value) ||
    m.nid.includes(value)
  );

  const table = document.getElementById("membersTable");
  table.innerHTML = "";

  filtered.forEach((m) => {
    table.innerHTML += `
      <tr>
        <td>${m.fullName}</td>
        <td>${m.phone}</td>
        <td>${m.nid}</td>
        <td>${m.status}</td>
        <td>
          <button onclick="editMember('${m.id}')">Edit</button>
          <button onclick="deleteMember('${m.id}')">Delete</button>
        </td>
      </tr>
    `;
  });
};

// ===============================
// MODAL OPEN
// ===============================
window.openAddModal = function () {
  document.getElementById("memberModal").style.display = "block";
  document.getElementById("modalTitle").innerText = "Add Member";

  document.getElementById("memberId").value = "";
  document.getElementById("fullName").value = "";
  document.getElementById("phone").value = "";
  document.getElementById("nid").value = "";
  document.getElementById("status").value = "Active";
};

window.closeModal = function () {
  document.getElementById("memberModal").style.display = "none";
};

// ===============================
// VALIDATION
// ===============================
function validate(phone, nid) {
  if (!/^\d{9}$/.test(phone)) {
    alert("Phone must be exactly 9 digits");
    return false;
  }

  if (!/^\d{16}$/.test(nid)) {
    alert("NID must be exactly 16 digits");
    return false;
  }

  return true;
}

// ===============================
// DUPLICATE CHECK
// ===============================
function isDuplicate(phone, nid, ignoreId = null) {
  return members.some((m) =>
    m.id !== ignoreId &&
    (m.phone === phone || m.nid === nid)
  );
}

// ===============================
// SAVE MEMBER
// ===============================
window.saveMember = async function () {
  const id = document.getElementById("memberId").value;
  const fullName = document.getElementById("fullName").value;
  const phone = document.getElementById("phone").value;
  const nid = document.getElementById("nid").value;
  const status = document.getElementById("status").value;

  if (!validate(phone, nid)) return;

  if (isDuplicate(phone, nid, id || null)) {
    alert("Phone or NID already exists");
    return;
  }

  if (id) {
    await updateDoc(doc(db, "members", id), {
      fullName,
      phone,
      nid,
      status
    });
  } else {
    await addDoc(membersRef, {
      fullName,
      phone,
      nid,
      status,
      createdAt: new Date()
    });
  }

  closeModal();
  loadMembers();
};

// ===============================
// EDIT
// ===============================
window.editMember = function (id) {
  const m = members.find(x => x.id === id);

  document.getElementById("memberModal").style.display = "block";
  document.getElementById("modalTitle").innerText = "Edit Member";

  document.getElementById("memberId").value = m.id;
  document.getElementById("fullName").value = m.fullName;
  document.getElementById("phone").value = m.phone;
  document.getElementById("nid").value = m.nid;
  document.getElementById("status").value = m.status;
};

// ===============================
// DELETE
// ===============================
window.deleteMember = async function (id) {
  if (confirm("Are you sure you want to delete this member?")) {
    await deleteDoc(doc(db, "members", id));
    loadMembers();
  }
};
