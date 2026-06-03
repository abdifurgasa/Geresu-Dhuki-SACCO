import { db, auth } from "./firebase.js";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const usersRef = collection(db, "users");

let users = [];
let filtered = [];
let currentPage = 1;
const perPage = 10;
let editingId = null;

/* ================= GLOBAL ================= */
window.openAddUser = openAddUser;
window.closeModal = closeModal;
window.saveUser = saveUser;
window.searchUsers = searchUsers;
window.nextPage = nextPage;
window.prevPage = prevPage;
window.deleteUser = deleteUser;

/* ================= LOAD ================= */
onSnapshot(usersRef, (snap) => {

  users = [];

  snap.forEach(d => {
    users.push({ id: d.id, ...d.data() });
  });

  filtered = [...users];

  document.getElementById("totalUsers").textContent = users.length;

  render();

});

/* ================= OPEN MODAL ================= */
function openAddUser() {
  editingId = null;
  document.getElementById("userId").value = "";
  document.getElementById("name").value = "";
  document.getElementById("email").value = "";
  document.getElementById("role").value = "user";
  document.getElementById("modalTitle").innerText = "Add User";
  document.getElementById("userModal").style.display = "flex";
}

/* ================= CLOSE ================= */
function closeModal() {
  document.getElementById("userModal").style.display = "none";
}

/* ================= SAVE ================= */
async function saveUser() {

  const user = auth.currentUser;

  if (!user) {
    alert("Session expired. Please login again.");
    return;
  }

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const role = document.getElementById("role").value;

  if (!name || !email) return alert("Fill all fields");

  if (!editingId) {

    await addDoc(usersRef, {
      name,
      email,
      role,
      createdAt: serverTimestamp(),
      createdBy: user.email
    });

  } else {

    await updateDoc(doc(db, "users", editingId), {
      name,
      email,
      role,
      updatedAt: serverTimestamp()
    });

  }

  closeModal();
}

/* ================= EDIT ================= */
window.editUser = async function (id) {

  const snap = await getDoc(doc(db, "users", id));

  if (!snap.exists()) return;

  const u = snap.data();

  editingId = id;

  document.getElementById("userId").value = id;
  document.getElementById("name").value = u.name;
  document.getElementById("email").value = u.email;
  document.getElementById("role").value = u.role;

  document.getElementById("modalTitle").innerText = "Edit User";
  document.getElementById("userModal").style.display = "flex";
};

/* ================= DELETE ================= */
async function deleteUser(id) {
  if (!confirm("Delete user?")) return;
  await deleteDoc(doc(db, "users", id));
}

/* ================= SEARCH ================= */
function searchUsers() {

  const k = document.getElementById("searchInput").value.toLowerCase();

  filtered = users.filter(u =>
    (u.name || "").toLowerCase().includes(k) ||
    (u.email || "").toLowerCase().includes(k)
  );

  render();
}

/* ================= TABLE ================= */
function render() {

  const tbody = document.getElementById("usersTable");
  tbody.innerHTML = "";

  const start = (currentPage - 1) * perPage;
  const page = filtered.slice(start, start + perPage);

  page.forEach(u => {

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${u.name || ""}</td>
      <td>${u.email || ""}</td>
      <td>${u.role || ""}</td>
      <td>${u.createdAt?.seconds ? new Date(u.createdAt.seconds * 1000).toLocaleString() : "-"}</td>
      <td>
        <button onclick="editUser('${u.id}')">Edit</button>
        <button onclick="deleteUser('${u.id}')">Delete</button>
      </td>
    `;

    tbody.appendChild(tr);

  });

  document.getElementById("pageInfo").innerText =
    `Page ${currentPage}`;
}

/* ================= PAGINATION ================= */
function nextPage() {
  currentPage++;
  render();
}

function prevPage() {
  if (currentPage > 1) currentPage--;
  render();
}
