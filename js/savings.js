import { db, auth } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================
   ELEMENTS
========================= */

const savingsTable = document.getElementById("savingsTable");
const savingsForm = document.getElementById("savingsForm");
const amountInput = document.getElementById("amount");

const modal = document.getElementById("savingsModal");
const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

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
   SELECTED MEMBER
========================= */

let selected = null;

/* =========================
   SEARCH MEMBER (INSIDE MODAL)
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
        selected = { id: doc.id, ...m };

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

  if (!selected) {
    alert("Select member first");
    return;
  }

  const amount = Number(amountInput.value);

  if (!amount || amount <= 0) {
    alert("Enter valid amount");
    return;
  }

  /* GET ALL SAVINGS OF MEMBER */
  const q = query(
    collection(db, "savings"),
    where("memberId", "==", selected.id)
  );

  const snap = await getDocs(q);

  let totalBefore = 0;

  const transactions = [];

  snap.forEach(d => {
    const data = d.data();
    const amt = Number(data.amount || 0);

    totalBefore += amt;

    transactions.push({
      ...data,
      amount: amt
    });
  });

  // previous saving = before this deposit
  const previousSaving = totalBefore;

  // total after deposit
  const totalSaving = previousSaving + amount;

  const createdBy =
    localStorage.getItem("name") ||
    auth.currentUser?.displayName ||
    "Admin";

  await addDoc(collection(db, "savings"), {
    memberId: selected.id,
    memberName: selected.name,
    memberPhone: selected.phone,

    amount, // current deposit ONLY
    previousSaving,
    totalSaving,

    createdAt: serverTimestamp(),
    createdBy
  });

  alert("Saved successfully");

  amountInput.value = "";
  modal.style.display = "none";

  loadSavings();
});

/* =========================
   LOAD SAVINGS TABLE
========================= */

async function loadSavings() {
  savingsTable.innerHTML = "";

  const membersSnap = await getDocs(collection(db, "members"));

  const savingsSnap = await getDocs(collection(db, "savings"));

  let savings = [];

  savingsSnap.forEach(d => {
    savings.push({ id: d.id, ...d.data() });
  });

  savings.sort((a, b) =>
    (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
  );

  membersSnap.forEach(memberDoc => {
    const member = memberDoc.data();

    const memberSavings = savings.filter(
      s => s.memberId === memberDoc.id
    );

    let depositAmount = 0;
    let previousSaving = 0;
    let totalSaving = 0;
    let createdBy = "-";
    let createdDate = "-";

    if (memberSavings.length > 0) {
      const latest = memberSavings[0];

      depositAmount = latest.amount || 0;
      previousSaving = latest.previousSaving || 0;
      totalSaving = latest.totalSaving || 0;
      createdBy = latest.createdBy || "-";

      createdDate = latest.createdAt
        ? new Date(latest.createdAt.seconds * 1000).toLocaleString()
        : "-";
    }

    const row = `
      <tr>
        <td>${member.name || "-"}</td>
        <td>${member.phone || "-"}</td>

        <td>${depositAmount.toLocaleString()} ETB</td>
        <td>${previousSaving.toLocaleString()} ETB</td>
        <td>${totalSaving.toLocaleString()} ETB</td>

        <td>${createdDate}</td>
        <td>${createdBy}</td>
      </tr>
    `;

    savingsTable.innerHTML += row;
  });
}

/* =========================
   START
========================= */

loadSavings();
