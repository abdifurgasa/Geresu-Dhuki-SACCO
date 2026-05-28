import { db, auth } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { initLanguage, translations } from "./i18n.js";

initLanguage();

/* ================================
   ELEMENTS
================================ */

const loanForm = document.getElementById("loanForm");
const loansTable = document.getElementById("loansTable");

const modal = document.getElementById("loanModal");
const openBtn = document.getElementById("openModalBtn");
const closeBtn = document.getElementById("closeModalBtn");

const searchInput = document.getElementById("searchMember");
const searchResults = document.getElementById("searchResults");
const selectedBox = document.getElementById("selectedMember");

/* ================================
   STATE
================================ */

let selectedMember = null;

/* ================================
   MODAL OPEN / CLOSE
================================ */

openBtn?.addEventListener("click", () => {
  modal.classList.add("active");
});

closeBtn?.addEventListener("click", () => {
  modal.classList.remove("active");
});

/* close outside */
window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.remove("active");
  }
});

/* ================================
   SEARCH MEMBER
================================ */

searchInput?.addEventListener("input", async (e) => {
  const value = e.target.value.trim();

  if (!value) {
    searchResults.innerHTML = "";
    return;
  }

  const snap = await getDocs(collection(db, "members"));

  const results = [];

  snap.forEach(doc => {
    const m = doc.data();

    if (
      m.name.toLowerCase().includes(value.toLowerCase()) ||
      m.phone.includes(value)
    ) {
      results.push({ id: doc.id, ...m });
    }
  });

  searchResults.innerHTML = results.map(m => `
    <div class="search-item" data-id="${m.id}">
      👤 ${m.name} - ${m.phone}
    </div>
  `).join("");

  document.querySelectorAll(".search-item").forEach(el => {
    el.addEventListener("click", () => {

      const id = el.dataset.id;

      selectedMember = results.find(r => r.id === id);

      selectedBox.innerHTML = `
        👤 ${selectedMember.name} (${selectedMember.phone})
      `;

      searchResults.innerHTML = "";
      searchInput.value = "";

    });
  });
});

/* ================================
   LOAD LOANS
================================ */

async function loadLoans() {

  const snap = await getDocs(
    query(collection(db, "loans"), orderBy("createdAt", "desc"))
  );

  loansTable.innerHTML = "";

  snap.forEach(doc => {

    const l = doc.data();

    loansTable.innerHTML += `
      <tr>
        <td>${l.name}</td>
        <td>${l.phone}</td>
        <td>${l.principal}</td>
        <td>${l.interest}</td>
        <td>${l.total}</td>
        <td>${l.remaining}</td>
        <td>${l.type}</td>
        <td>${l.duration}</td>
        <td>${l.status}</td>
        <td>${l.createdAt?.toDate?.().toLocaleString() || "-"}</td>
        <td>${l.createdBy || "-"}</td>
        <td>
          <button class="delete-btn" data-id="${doc.id}">
            ❌
          </button>
        </td>
      </tr>
    `;
  });

  /* DELETE */
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {

      const id = btn.dataset.id;

      await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js")
        .then(async ({ deleteDoc, doc }) => {

          await deleteDoc(doc(db, "loans", id));

          loadLoans();

        });

    });
  });
}

/* ================================
   ADD LOAN
================================ */

loanForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!selectedMember) {
    alert("Please select a member");
    return;
  }

  const principal = Number(document.getElementById("principal").value);
  const rate = Number(document.getElementById("rate").value);
  const time = Number(document.getElementById("time").value);
  const timeType = document.getElementById("timeType").value;
  const interestType = document.getElementById("interestType").value;

  /* SIMPLE INTEREST */
  let interest = (principal * rate * time) / 100;
  let total = principal + interest;

  const remaining = total;

  await addDoc(collection(db, "loans"), {
    memberId: selectedMember.id,
    name: selectedMember.name,
    phone: selectedMember.phone,

    principal,
    rate,
    time,
    timeType,
    type: interestType,

    interest,
    total,
    remaining,

    status: "Active",

    createdAt: serverTimestamp(),
    createdBy: localStorage.getItem("name") || "Admin"
  });

  loanForm.reset();
  modal.classList.remove("active");

  loadLoans();
});

/* ================================
   INIT
================================ */

loadLoans();
