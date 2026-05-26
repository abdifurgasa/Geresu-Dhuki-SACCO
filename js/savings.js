import { db, auth } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  orderBy,
  deleteDoc,
  doc,
  updateDoc
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
   MODAL
========================= */

openModalBtn?.addEventListener("click", () => {
  modal.style.display = "flex";
});

closeModalBtn?.addEventListener("click", () => {
  modal.style.display = "none";
});

/* =========================
   SEARCH MEMBER (INSIDE MODAL)
========================= */

searchInput?.addEventListener("input", async () => {
  const val = searchInput.value.toLowerCase();
  searchResults.innerHTML = "";

  if (!val) return;

  const snap = await getDocs(collection(db, "members"));

  snap.forEach((docSnap) => {
    const m = docSnap.data();

    if (
      m.name?.toLowerCase().includes(val) ||
      m.phone?.includes(val)
    ) {
      const div = document.createElement("div");

      div.className = "search-item";
      div.innerHTML = `<strong>${m.name}</strong><br><small>${m.phone}</small>`;

      div.onclick = () => {
        selectedMember = {
          id: docSnap.id,
          ...m
        };

        selectedMemberBox.innerHTML = `
          👤 ${m.name} <br>
          📱 ${m.phone}
        `;

        searchResults.innerHTML = "";
      };

      searchResults.appendChild(div);
    }
  });
});

/* =========================
   ADD SAVING
========================= */

savingsForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!selectedMember) {
    alert("Select a member first");
    return;
  }

  const amount = Number(amountInput.value);

  if (!amount || amount <= 0) {
    alert("Invalid amount");
    return;
  }

  const createdBy =
    localStorage.getItem("name") ||
    auth.currentUser?.displayName ||
    "Admin";

  await addDoc(collection(db, "savings"), {
    memberId: selectedMember.id,
    memberName: selectedMember.name,
    memberPhone: selectedMember.phone,

    amount, // CURRENT DEPOSIT ONLY
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

  const savingsQuery = query(
    collection(db, "savings"),
    orderBy("createdAt", "desc")
  );

  const savingsSnap = await getDocs(savingsQuery);

  const savingsData = [];

  savingsSnap.forEach(docSnap => {
    savingsData.push({
      id: docSnap.id,
      ...docSnap.data()
    });
  });

  membersSnap.forEach(memberDoc => {
    const member = memberDoc.data();

    const memberSavings = savingsData.filter(
      s => s.memberId === memberDoc.id
    );

    let currentDeposit = 0;
    let totalSaving = 0;
    let previousSaving = 0;
    let createdBy = "-";
    let createdDate = "-";

    if (memberSavings.length > 0) {

      const latest = memberSavings[0];

      currentDeposit = Number(latest.amount || 0);

      totalSaving = memberSavings.reduce(
        (sum, s) => sum + Number(s.amount || 0),
        0
      );

      previousSaving = totalSaving - currentDeposit;

      createdBy = latest.createdBy || "Admin";

      createdDate = latest.createdAt
        ? new Date(latest.createdAt.seconds * 1000).toLocaleString()
        : "-";
    }

    const row = `
      <tr>
        <td>${member.name || "-"}</td>
        <td>${member.phone || "-"}</td>

        <td>${currentDeposit.toLocaleString()} ETB</td>
        <td>${previousSaving.toLocaleString()} ETB</td>
        <td>${totalSaving.toLocaleString()} ETB</td>

        <td>${createdDate}</td>
        <td>${createdBy}</td>

        <td>
          <button onclick="deleteSaving('${memberDoc.id}')">Delete</button>
        </td>
      </tr>
    `;

    savingsTable.innerHTML += row;
  });
}

/* =========================
   DELETE SAVING (OPTION)
========================= */

window.deleteSaving = async function(memberId) {
  const confirmDelete = confirm("Delete all savings for this member?");

  if (!confirmDelete) return;

  const q = query(
    collection(db, "savings"),
    where("memberId", "==", memberId)
  );

  const snap = await getDocs(q);

  snap.forEach(async (docSnap) => {
    await deleteDoc(doc(db, "savings", docSnap.id));
  });

  loadSavings();
};

/* =========================
   INIT
========================= */

loadSavings();
