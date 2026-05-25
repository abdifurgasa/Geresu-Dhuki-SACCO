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

/* =========================
   ELEMENTS
========================= */

const savingsTable = document.getElementById("savingsTable");
const savingsForm = document.getElementById("savingsForm");
const amountInput = document.getElementById("amount");

const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const modal = document.getElementById("savingsModal");

const searchInput = document.getElementById("searchMember");
const searchResults = document.getElementById("searchResults");
const selectedMember = document.getElementById("selectedMember");

/* =========================
   MODAL
========================= */

openModalBtn?.addEventListener("click", () => {
  modal.style.display = "flex";
});

closeModalBtn?.addEventListener("click", () => {
  modal.style.display = "none";
});

/* =========================
   GLOBAL SELECTED MEMBER
========================= */

let selected = null;

/* =========================
   SEARCH MEMBER
========================= */

searchInput?.addEventListener("input", async () => {

  const val = searchInput.value.toLowerCase();

  searchResults.innerHTML = "";

  if (!val) return;

  const snap = await getDocs(collection(db, "members"));

  snap.forEach(doc => {

    const m = doc.data();

    if (
      m.name?.toLowerCase().includes(val) ||
      m.phone?.includes(val)
    ) {

      const div = document.createElement("div");

      div.className = "search-item";

      div.innerHTML = `
        <strong>${m.name}</strong><br>
        <small>${m.phone}</small>
      `;

      div.onclick = () => {

        selected = {
          id: doc.id,
          ...m
        };

        selectedMember.innerHTML = `
          👤 ${m.name}<br>
          📱 ${m.phone}
        `;

        searchResults.innerHTML = "";

      };

      searchResults.appendChild(div);

    }

  });

});

/* =========================
   SAVE SAVINGS
========================= */

savingsForm?.addEventListener("submit", async (e) => {

  e.preventDefault();

  try {

    if (!selected) {
      alert("Select a member first");
      return;
    }

    const amount = Number(amountInput.value);

    if (!amount || amount <= 0) {
      alert("Enter valid amount");
      return;
    }

    /* =========================
       GET PREVIOUS SAVINGS
    ========================= */

    const savingsQuery = query(
      collection(db, "savings"),
      where("memberId", "==", selected.id)
    );

    const savingsSnap = await getDocs(savingsQuery);

    let previousSaving = 0;

    savingsSnap.forEach(doc => {
      previousSaving += Number(doc.data().amount || 0);
    });

    const totalSaving = previousSaving + amount;

    /* =========================
       CURRENT USER NAME
    ========================= */

    const currentUserName =
      localStorage.getItem("userName") ||
      auth.currentUser?.displayName ||
      "Admin";

    /* =========================
       SAVE TO FIREBASE
    ========================= */

    await addDoc(collection(db, "savings"), {

      memberId: selected.id,
      memberName: selected.name,
      memberPhone: selected.phone,

      amount,
      previousSaving,
      totalSaving,

      createdAt: serverTimestamp(),

      // ✅ SAVE NAME NOT EMAIL
      createdBy: currentUserName

    });

    alert("Savings added successfully");

    amountInput.value = "";

    modal.style.display = "none";

    loadSavings();

  } catch (err) {

    console.error(err);
    alert(err.message);

  }

});

/* =========================
   LOAD SAVINGS TABLE
========================= */

async function loadSavings() {

  savingsTable.innerHTML = "";

  /* =========================
     ORDER BY LATEST TIME
  ========================= */

  const q = query(
    collection(db, "savings"),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  snap.forEach(doc => {

    const d = doc.data();

    const createdDate = d.createdAt
      ? new Date(d.createdAt.seconds * 1000).toLocaleString()
      : "-";

    const row = `
  <tr>

    <td>${d.memberName || "-"}</td>

    <td>${d.memberPhone || "-"}</td>

    <td>
      ${Number(d.amount || 0).toLocaleString()} ETB
    </td>

    <td>
      ${Number(d.previousSaving || 0).toLocaleString()} ETB
    </td>

    <td>
      ${Number(d.totalSaving || 0).toLocaleString()} ETB
    </td>

    <td>${createdDate}</td>

    <td>${d.createdBy || "Admin"}</td>

  </tr>
`;

/* =========================
   START
========================= */

loadSavings();
