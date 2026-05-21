import { db, auth } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// ===============================
// COLLECTIONS
// ===============================

const membersRef = collection(db, "members");
const savingsRef = collection(db, "savings");


// ===============================
// ELEMENTS
// ===============================

const savingsForm = document.getElementById("savingsForm");
const savingsTable = document.getElementById("savingsTable");

const searchMember = document.getElementById("searchMember");
const searchResults = document.getElementById("searchResults");

const selectedMember = document.getElementById("selectedMember");

const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

const savingsModal = document.getElementById("savingsModal");

const logoutBtn = document.getElementById("logoutBtn");

const amountInput = document.getElementById("amount");


// ===============================
// GLOBAL STATE
// ===============================

let members = [];
let selectedMemberData = null;


// ===============================
// AUTH CHECK
// ===============================

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  }
});


// ===============================
// LOGOUT
// ===============================

logoutBtn?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});


// ===============================
// MODAL CONTROL
// ===============================

openModalBtn?.addEventListener("click", () => {
  savingsModal.style.display = "flex";
});

closeModalBtn?.addEventListener("click", () => {
  savingsModal.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === savingsModal) {
    savingsModal.style.display = "none";
  }
});


// ===============================
// LOAD MEMBERS
// ===============================

async function loadMembers() {
  const snapshot = await getDocs(membersRef);

  members = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

loadMembers();


// ===============================
// SEARCH MEMBERS
// ===============================

searchMember?.addEventListener("input", () => {

  const value = searchMember.value.toLowerCase();

  searchResults.innerHTML = "";

  if (!value) {
    searchResults.style.display = "none";
    return;
  }

  const filtered = members.filter(m =>
    m.name?.toLowerCase().includes(value) ||
    m.phone?.includes(value) ||
    m.nid?.includes(value)
  );

  filtered.slice(0, 5).forEach(member => {

    const div = document.createElement("div");

    div.className = "search-item";

    div.innerHTML = `
      <strong>${member.name}</strong><br>
      📞 ${member.phone}
    `;

    div.onclick = () => {

      selectedMemberData = member;

      selectedMember.innerHTML = `
        👤 <strong>${member.name}</strong><br>
        📞 ${member.phone}<br>
        🪪 ${member.nid}<br>
        💰 Savings: ${member.savings || 0} ETB
      `;

      searchMember.value = member.name;
      searchResults.style.display = "none";
    };

    searchResults.appendChild(div);
  });

  searchResults.style.display = "block";
});


// ===============================
// CLOSE SEARCH
// ===============================

document.addEventListener("click", (e) => {
  if (!searchMember.contains(e.target) && !searchResults.contains(e.target)) {
    searchResults.style.display = "none";
  }
});


// ===============================
// ONLY NUMBER INPUT
// ===============================

amountInput?.addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/\D/g, "");
});


// ===============================
// SAVE SAVINGS
// ===============================

savingsForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!selectedMemberData) {
    alert("Select a member first");
    return;
  }

  const amount = Number(amountInput.value);

  if (amount <= 0) {
    alert("Invalid amount");
    return;
  }

  try {

    const user = auth.currentUser;

    await addDoc(savingsRef, {
      memberId: selectedMemberData.id,
      memberName: selectedMemberData.name,
      phone: selectedMemberData.phone,
      amount,
      createdBy: user?.email || "Admin",
      createdDate: new Date().toLocaleDateString(),
      timestamp: serverTimestamp()
    });

    const memberDoc = doc(db, "members", selectedMemberData.id);

    await updateDoc(memberDoc, {
      savings: increment(amount)
    });

    savingsForm.reset();
    selectedMemberData = null;
    selectedMember.innerHTML = "👤 Select a member";
    savingsModal.style.display = "none";

    alert("Savings saved successfully");

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
});


// ===============================
// REALTIME SAVINGS TABLE
// ===============================

const q = query(savingsRef, orderBy("timestamp", "desc"));

onSnapshot(q, (snap) => {

  savingsTable.innerHTML = "";

  snap.forEach(docSnap => {

    const d = docSnap.data();

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${d.memberName}</td>
      <td>${d.phone}</td>
      <td>${d.amount} ETB</td>
      <td>${d.createdDate}</td>
      <td>${d.createdBy}</td>
    `;

    savingsTable.appendChild(tr);
  });

});
