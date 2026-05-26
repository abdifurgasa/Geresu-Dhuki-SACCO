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

const savingsTable =
  document.getElementById("savingsTable");

const savingsForm =
  document.getElementById("savingsForm");

const amountInput =
  document.getElementById("amount");

const openModalBtn =
  document.getElementById("openModalBtn");

const closeModalBtn =
  document.getElementById("closeModalBtn");

const modal =
  document.getElementById("savingsModal");

const searchInput =
  document.getElementById("searchMember");

const searchResults =
  document.getElementById("searchResults");

const selectedMember =
  document.getElementById("selectedMember");

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
   GLOBAL MEMBER
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

    const currentUserName =
      localStorage.getItem("name") ||
      auth.currentUser?.displayName ||
      "Admin";

    await addDoc(collection(db, "savings"), {

      memberId: selected.id,
      memberName: selected.name,
      memberPhone: selected.phone,

      amount,
      createdAt: serverTimestamp(),
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

  const membersSnap = await getDocs(collection(db, "members"));
  const savingsSnap = await getDocs(collection(db, "savings"));

  let savingsData = [];

  savingsSnap.forEach(doc => {
    savingsData.push({
      id: doc.id,
      ...doc.data()
    });
  });

  savingsData.sort((a, b) =>
    (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
  );

  membersSnap.forEach(memberDoc => {

    const member = memberDoc.data();

    const memberSavings =
      savingsData.filter(s => s.memberId === memberDoc.id);

    memberSavings.sort((a, b) =>
      (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
    );

    let depositAmount = 0;
    let previousSaving = 0;
    let totalSaving = 0;
    let createdDate = "-";
    let createdBy = "-";

    if (memberSavings.length > 0) {

      const latest =
        memberSavings[memberSavings.length - 1];

      depositAmount =
        Number(latest.amount || 0);

      totalSaving =
        memberSavings.reduce(
          (sum, s) => sum + Number(s.amount || 0),
          0
        );

      previousSaving =
        totalSaving - depositAmount;

      createdDate = latest.createdAt
        ? new Date(latest.createdAt.seconds * 1000).toLocaleString()
        : "-";

      createdBy =
        latest.createdBy || "Admin";
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
