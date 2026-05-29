import { db, auth }
from "./firebase.js";

import {
  initLanguage,
  translations
}
from "./i18n.js";

import {

  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================================================
   INIT LANGUAGE
========================================================= */

initLanguage();

/* =========================================================
   ELEMENTS
========================================================= */

const loansTable =
  document.getElementById("loansTable");

const modal =
  document.getElementById("loanModal");

const openModalBtn =
  document.getElementById("openModalBtn");

const closeModalBtn =
  document.getElementById("closeModalBtn");

const loanForm =
  document.getElementById("loanForm");

const searchInput =
  document.getElementById("searchMember");

const searchResults =
  document.getElementById("searchResults");

const selectedBox =
  document.getElementById("selectedMember");

/* DELETE */

const deleteModal =
  document.getElementById("deleteModal");

const confirmDeleteBtn =
  document.getElementById("confirmDeleteBtn");

const cancelDeleteBtn =
  document.getElementById("cancelDeleteBtn");

/* =========================================================
   STATE
========================================================= */

let members = [];

let selectedMember = null;

let editingId = null;

let deleteId = null;

/* =========================================================
   MODAL
========================================================= */

openModalBtn.onclick = () => {

  modal.classList.add("active");

};

closeModalBtn.onclick = () => {

  modal.classList.remove("active");

};

window.onclick = (e) => {

  if (e.target === modal) {

    modal.classList.remove("active");

  }

  if (e.target === deleteModal) {

    deleteModal.classList.remove("active");

  }

};

/* =========================================================
   LOAD MEMBERS
========================================================= */

async function loadMembers() {

  const snap =
    await getDocs(collection(db, "members"));

  members =
    snap.docs.map(doc => ({

      id: doc.id,

      ...doc.data()

    }));

}

loadMembers();

/* =========================================================
   SEARCH
========================================================= */

searchInput.addEventListener("input", () => {

  const value =
    searchInput.value.toLowerCase();

  searchResults.innerHTML = "";

  if (!value) return;

  const filtered =
    members.filter(m =>

      m.name.toLowerCase().includes(value) ||

      m.phone.includes(value)

    );

  filtered.forEach(member => {

    const div =
      document.createElement("div");

    div.className = "search-item";

    div.innerHTML = `
      ${member.name}
      <br>
      <small>${member.phone}</small>
    `;

    div.onclick = () => {

      selectedMember = member;

      selectedBox.innerHTML =
        `👤 ${member.name}`;

      searchResults.innerHTML = "";

      searchInput.value = "";

    };

    searchResults.appendChild(div);

  });

});

/* =========================================================
   STATUS COLORS
========================================================= */

const statusColors = {

  Pending: "#f39c12",

  Approved: "#27ae60",

  Rejected: "#e74c3c"

};

/* =========================================================
   LOAD LOANS
========================================================= */

async function loadLoans() {

  const snap = await getDocs(
    query(
      collection(db, "loans"),
      orderBy("createdAt", "desc")
    )
  );

  loansTable.innerHTML = "";

  snap.forEach((d) => {

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

          <span
            style="
              background:${statusColors[l.status]};
              color:white;
              padding:6px 12px;
              border-radius:20px;
              font-size:12px;
            "
          >
            ${l.status}
          </span>

        </td>

        <td>
          ${
            l.createdAt?.toDate?.()
            ?.toLocaleString() || "-"
          }
        </td>

        <td>${l.createdBy}</td>

        <td>

          <button
            class="approve-btn"
            onclick="approveLoan('${d.id}')"
          >
            ✅
          </button>

          <button
            class="reject-btn"
            onclick="rejectLoan('${d.id}')"
          >
            ❌
          </button>

          <button
            class="edit-btn"
            onclick="editLoan('${d.id}')"
          >
            ✏️
          </button>

          <button
            class="delete-btn"
            onclick="openDelete('${d.id}')"
          >
            🗑️
          </button>

        </td>

      </tr>

    `;

  });

}

loadLoans();

/* =========================================================
   SAVE LOAN
========================================================= */

loanForm.onsubmit = async (e) => {

  e.preventDefault();

  const lang =
    localStorage.getItem("language") || "en";

  if (!selectedMember) {

    alert(
      translations[lang].select_member
    );

    return;

  }

  const principal =
    Number(document.getElementById("principal").value);

  const rate =
    Number(document.getElementById("rate").value);

  const time =
    Number(document.getElementById("time").value);

  const type =
    document.getElementById("interestType").value;

  const interest =
    (principal * rate * time) / 100;

  const total =
    principal + interest;

  const data = {

    memberId:
      selectedMember.id,

    name:
      selectedMember.name,

    phone:
      selectedMember.phone,

    principal,

    rate,

    time,

    type,

    interest,

    total,

    remaining:
      total,

    status:
      "Pending",

    createdAt:
      serverTimestamp(),

    createdBy:
      localStorage.getItem("name") ||
      auth.currentUser?.displayName ||
      "Admin"

  };

  if (editingId) {

    await updateDoc(
      doc(db, "loans", editingId),
      data
    );

    editingId = null;

  } else {

    await addDoc(
      collection(db, "loans"),
      data
    );

  }

  loanForm.reset();

  modal.classList.remove("active");

  selectedMember = null;

  selectedBox.innerHTML =
    translations[lang].select_member;

  loadLoans();

};

/* =========================================================
   EDIT
========================================================= */

window.editLoan = async (id) => {

  const snap =
    await getDocs(collection(db, "loans"));

  const loan =
    snap.docs.find(d => d.id === id);

  if (!loan) return;

  const l = loan.data();

  editingId = id;

  document.getElementById("principal").value =
    l.principal;

  document.getElementById("rate").value =
    l.rate;

  document.getElementById("time").value =
    l.time;

  document.getElementById("interestType").value =
    l.type;

  selectedMember = {

    id: l.memberId,

    name: l.name,

    phone: l.phone

  };

  selectedBox.innerHTML =
    `👤 ${l.name}`;

  modal.classList.add("active");

};

/* =========================================================
   DELETE
========================================================= */

window.openDelete = (id) => {

  deleteId = id;

  deleteModal.classList.add("active");

};

confirmDeleteBtn.onclick = async () => {

  await deleteDoc(
    doc(db, "loans", deleteId)
  );

  deleteModal.classList.remove("active");

  loadLoans();

};

cancelDeleteBtn.onclick = () => {

  deleteModal.classList.remove("active");

};

/* =========================================================
   APPROVE
========================================================= */

window.approveLoan = async (id) => {

  await updateDoc(
    doc(db, "loans", id),
    {
      status: "Approved"
    }
  );

  loadLoans();

};

/* =========================================================
   REJECT
========================================================= */

window.rejectLoan = async (id) => {

  await updateDoc(
    doc(db, "loans", id),
    {
      status: "Rejected"
    }
  );

  loadLoans();

};
