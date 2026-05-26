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
const selectedMemberBox = document.getElementById("selectedMember");

let selectedMember = null;

/* =========================
   OPEN / CLOSE MODAL
========================= */

openModalBtn?.addEventListener("click", () => {
  modal.style.display = "flex";
});

closeModalBtn?.addEventListener("click", () => {
  modal.style.display = "none";
});

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
        selectedMember = { id: doc.id, ...m };

        selectedMemberBox.innerHTML = `
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

  if (!selectedMember) {
    alert("Select member first");
    return;
  }

  const deposit = Number(amountInput.value);

  if (!deposit || deposit <= 0) {
    alert("Enter valid amount");
    return;
  }

  /* =========================
     GET ALL SAVINGS
  ========================= */

  const q = query(
    collection(db, "savings"),
    where("memberId", "==", selectedMember.id)
  );

  const snap = await getDocs(q);

  let allDeposits = [];

  snap.forEach(d => {
    allDeposits.push(d.data());
  });

  /* =========================
     TOTAL SAVING (BEFORE INSERT)
  ========================= */

  const totalBefore = allDeposits.reduce(
    (sum, x) => sum + Number(x.amount || 0),
    0
  );

  const previousSaving = totalBefore;
  const totalSaving = totalBefore + deposit;

  const createdBy =
    localStorage.getItem("name") ||
    auth.currentUser?.displayName ||
    "Admin";

  /* =========================
     SAVE NEW TRANSACTION
  ========================= */

  await addDoc(collection(db, "savings"), {
    memberId: selectedMember.id,
    memberName: selectedMember.name,
    memberPhone: selectedMember.phone,

    amount: deposit,
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
   LOAD TABLE
========================= */

async function loadSavings() {
  savingsTable.innerHTML = "";

  const membersSnap = await getDocs(collection(db, "members"));
  const savingsSnap = await getDocs(collection(db, "savings"));

  let savings = [];

  savingsSnap.forEach(d => {
    savings.push(d.data());
  });

  savings.sort((a, b) =>
    (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
  );

  membersSnap.forEach(memberDoc => {
    const member = memberDoc.data();

    const memberSavings = savings.filter(
      s => s.memberId === memberDoc.id
    );

    let last = memberSavings[0] || null;

    let depositAmount = last ? last.amount : 0;
    let previousSaving = last ? last.previousSaving : 0;
    let totalSaving = last ? last.totalSaving : 0;
    let createdBy = last ? last.createdBy : "-";

    let createdDate = last?.createdAt
      ? new Date(last.createdAt.seconds * 1000).toLocaleString()
      : "-";

    const row = `
      <tr>
        <td>${member.name}</td>
        <td>${member.phone}</td>

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

loadSavings();
