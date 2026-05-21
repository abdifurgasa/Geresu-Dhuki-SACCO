import { db, storage, auth } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

/* =========================
   ELEMENTS
========================= */
const memberForm = document.getElementById("memberForm");
const membersTable = document.getElementById("membersTable");

const searchInput = document.getElementById("searchMember");
const searchResults = document.getElementById("searchResults");
const selectedMember = document.getElementById("selectedMember");

const modal = document.getElementById("memberModal");
const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

/* =========================
   MODAL FIX
========================= */
function openModal() {
  modal.style.display = "flex";
}

function closeModal() {
  modal.style.display = "none";
}

if (openModalBtn) {
  openModalBtn.addEventListener("click", openModal);
}

if (closeModalBtn) {
  closeModalBtn.addEventListener("click", closeModal);
}

window.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

      const photoUrl = await getDownloadURL(storageRef);

      const user = auth.currentUser;

      await addDoc(collection(db, "members"), {
        name,
        phone,
        nid,
        savings: 0,
        loanTotal: 0,
        loanRemaining: 0,
        status: "active",
        createdAt: serverTimestamp(),
        createdBy: user ? user.email : "admin"
      });

      alert("✅ Member saved successfully");

/* =========================
   LOAD MEMBERS
========================= */
async function loadMembers() {
  if (!membersTable) return;

  membersTable.innerHTML = "";

  const snapshot = await getDocs(collection(db, "members"));

  snapshot.forEach((doc) => {
    const m = doc.data();

    membersTable.innerHTML += `
      <tr>
        <td>${m.name}</td>
        <td>${m.phone}</td>
        <td>${m.nid}</td>
        <td>${m.savings}</td>
        <td>${m.loanTotal}</td>
        <td>${m.loanRemaining}</td>
        <td>${m.status}</td>
        <td>${m.createdDate}</td>
        <td>${m.createdBy}</td>
      </tr>
    `;
  });
}

loadMembers();
