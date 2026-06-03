import { db, auth } from "./firebase.js";

import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================
COLLECTIONS
========================= */

const savingsCollection = collection(db, "savings");
const membersCollection = collection(db, "members");

/* =========================
STATE
========================= */

let savings = [];
let members = [];
let selectedMember = null;

/* =========================
GLOBAL FUNCTIONS (IMPORTANT FIX)
========================= */

window.selectMember = selectMember;
window.deleteSaving = deleteSaving;

/* =========================
LOAD MEMBERS FOR SEARCH
========================= */

onSnapshot(membersCollection, (snapshot) => {

  members = [];

  snapshot.forEach((docSnap) => {
    members.push({
      id: docSnap.id,
      ...docSnap.data()
    });
  });

});

/* =========================
MEMBER SEARCH UI
========================= */

const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");

if (searchInput) {

  searchInput.addEventListener("input", () => {

    const keyword = searchInput.value.toLowerCase();

    const filtered = members.filter(m =>
      (m.fullName || "").toLowerCase().includes(keyword) ||
      (m.phone || "").includes(keyword)
    );

    searchResults.innerHTML = "";

    filtered.forEach(m => {

      const div = document.createElement("div");
      div.className = "search-item";
      div.innerHTML = `
        👤 ${m.fullName} - ${m.phone}
      `;

      div.onclick = () => selectMember(m);

      searchResults.appendChild(div);

    });

  });

}

/* =========================
SELECT MEMBER
========================= */

function selectMember(member) {

  selectedMember = member;

  document.getElementById("selectedMember").innerHTML = `
    👤 ${member.fullName} (${member.phone})
  `;

  document.getElementById("searchResults").innerHTML = "";

  loadSavings(member.id);
}

/* =========================
SAVE SAVING
========================= */

const form = document.getElementById("savingForm");

if (form) {

  form.addEventListener("submit", async (e) => {

    e.preventDefault();

    try {

      const user = auth.currentUser;

      if (!user) {
        alert("User not logged in or session expired.");
        return;
      }

      if (!selectedMember) {
        alert("Please select a member first");
        return;
      }

      const amount = Number(document.getElementById("amount").value);

      if (!amount || amount <= 0) {
        alert("Invalid amount");
        return;
      }

      await addDoc(savingsCollection, {

        memberId: selectedMember.id,
        memberName: selectedMember.fullName,
        phone: selectedMember.phone,

        amount,

        createdBy: user.email || "System",
        createdAt: serverTimestamp()

      });

      form.reset();

      loadSavings(selectedMember.id);

    } catch (err) {
      console.error(err);
      alert(err.message);
    }

  });

}

/* =========================
LOAD SAVINGS
========================= */

function loadSavings(memberId) {

  onSnapshot(savingsCollection, (snapshot) => {

    savings = [];

    snapshot.forEach((docSnap) => {

      const data = docSnap.data();

      if (data.memberId === memberId) {

        savings.push({
          id: docSnap.id,
          ...data
        });

      }

    });

    renderTable();

  });

}

/* =========================
RENDER TABLE
========================= */

function renderTable() {

  const tbody = document.getElementById("savingsTable");

  if (!tbody) return;

  tbody.innerHTML = "";

  let total = 0;

  savings.forEach(s => {

    total += Number(s.amount);

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${s.memberName || ""}</td>
      <td>${s.phone || ""}</td>
      <td>${s.amount}</td>
      <td>-</td>
      <td>${total}</td>
      <td>${formatDate(s.createdAt)}</td>
      <td>
        <button onclick="deleteSaving('${s.id}')">Delete</button>
      </td>
    `;

    tbody.appendChild(tr);

  });

}

/* =========================
DELETE SAVING
========================= */

async function deleteSaving(id) {

  if (!confirm("Delete this saving?")) return;

  await deleteDoc(doc(db, "savings", id));

  if (selectedMember) {
    loadSavings(selectedMember.id);
  }

}

/* =========================
DATE FORMAT
========================= */

function formatDate(timestamp) {

  if (!timestamp) return "-";

  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toLocaleString();
  }

  return "-";
}
