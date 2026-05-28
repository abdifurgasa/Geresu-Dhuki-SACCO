import { db, auth } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  orderBy,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================
   ELEMENTS
========================= */

const loanForm = document.getElementById("loanForm");
const loansTable = document.getElementById("loansTable");

const modal = document.getElementById("loanModal");
const openBtn = document.getElementById("openModalBtn");
const closeBtn = document.getElementById("closeModalBtn");

/* CONFIRM MODAL */
const confirmModal = document.getElementById("confirmModal");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

/* SEARCH */
const searchInput = document.getElementById("searchMember");
const searchResults = document.getElementById("searchResults");
const selectedBox = document.getElementById("selectedMember");

/* =========================
   STATE
========================= */

let selectedMember = null;
let editingId = null;
let deleteId = null;

/* =========================
   MODAL OPEN / CLOSE
========================= */

openBtn.onclick = () => modal.classList.add("active");
closeBtn.onclick = () => modal.classList.remove("active");

/* =========================
   SEARCH MEMBER
========================= */

searchInput?.addEventListener("input", async (e) => {

  const value = e.target.value.toLowerCase();

  const snap = await getDocs(collection(db, "members"));

  let results = [];

  snap.forEach(d => {
    const m = d.data();

    if (
      m.name.toLowerCase().includes(value) ||
      m.phone.includes(value)
    ) {
      results.push({ id: d.id, ...m });
    }
  });

  searchResults.innerHTML = results.map(m => `
    <div class="search-item" data-id="${m.id}">
      ${m.name} - ${m.phone}
    </div>
  `).join("");

  document.querySelectorAll(".search-item").forEach(el => {
    el.onclick = () => {
      selectedMember = results.find(r => r.id === el.dataset.id);
      selectedBox.innerHTML = `👤 ${selectedMember.name}`;
      searchResults.innerHTML = "";
    };
  });

});

/* =========================
   LOAD LOANS
========================= */

async function loadLoans() {

  const snap = await getDocs(
    query(collection(db, "loans"), orderBy("createdAt", "desc"))
  );

  loansTable.innerHTML = "";

  snap.forEach(d => {

    const l = d.data();

    loansTable.innerHTML += `
      <tr>
        <td>${l.name}</td>
        <td>${l.phone}</td>
        <td>${l.principal}</td>
        <td>${l.interest}</td>
        <td>${l.total}</td>
        <td>${l.remaining}</td>
        <td>${l.type}</td>
        <td>${l.time}</td>
        <td>
          <button onclick="editLoan('${d.id}')">✏️</button>
          <button onclick="openDelete('${d.id}')">🗑️</button>
        </td>
      </tr>
    `;
  });
}

/* =========================
   ADD / EDIT LOAN
========================= */

loanForm.onsubmit = async (e) => {
  e.preventDefault();

  const principal = Number(document.getElementById("principal").value);
  const rate = Number(document.getElementById("rate").value);
  const time = Number(document.getElementById("time").value);
  const type = document.getElementById("interestType").value;

  const interest = (principal * rate * time) / 100;
  const total = principal + interest;

  const data = {
    memberId: selectedMember.id,
    name: selectedMember.name,
    phone: selectedMember.phone,
    principal,
    rate,
    time,
    type,
    interest,
    total,
    remaining: total,
    createdAt: serverTimestamp(),
    createdBy: "Admin"
  };

  if (editingId) {
    await updateDoc(doc(db, "loans", editingId), data);
    editingId = null;
  } else {
    await addDoc(collection(db, "loans"), data);
  }

  loanForm.reset();
  modal.classList.remove("active");

  loadLoans();
};

/* =========================
   EDIT
========================= */

window.editLoan = async (id) => {

  const snap = await getDocs(collection(db, "loans"));

  snap.forEach(d => {
    if (d.id === id) {

      const l = d.data();

      document.getElementById("principal").value = l.principal;
      document.getElementById("rate").value = l.rate;
      document.getElementById("time").value = l.time;

      selectedMember = {
        id: l.memberId,
        name: l.name,
        phone: l.phone
      };

      selectedBox.innerHTML = `✏️ Editing ${l.name}`;

      editingId = id;

      modal.classList.add("active");
    }
  });
};

/* =========================
   DELETE CONFIRM MODAL
========================= */

window.openDelete = (id) => {
  deleteId = id;
  confirmModal.classList.add("active");
};

cancelDeleteBtn.onclick = () => {
  confirmModal.classList.remove("active");
  deleteId = null;
};

confirmDeleteBtn.onclick = async () => {
  await deleteDoc(doc(db, "loans", deleteId));

  deleteId = null;
  confirmModal.classList.remove("active");

  loadLoans();
};

/* =========================
   INIT
========================= */

loadLoans();
