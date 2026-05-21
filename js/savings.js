import { db, auth } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// ================= FIRESTORE =================
const membersRef = collection(db, "members");
const savingsRef = collection(db, "savings");


// ================= ELEMENTS =================
const savingsForm = document.getElementById("savingsForm");
const savingsTable = document.getElementById("savingsTable");

const searchMember = document.getElementById("searchMember");
const searchResults = document.getElementById("searchResults");

const selectedMember = document.getElementById("selectedMember");

const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const savingsModal = document.getElementById("savingsModal");

const amountInput = document.getElementById("amount");

const langSelect = document.getElementById("langSelect");


// ================= STATE =================
let members = [];
let selectedMemberData = null;


// ================= AUTH CHECK =================
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  }
});


// ================= MODAL =================
openModalBtn.onclick = () => {
  savingsModal.style.display = "flex";
};

closeModalBtn.onclick = () => {
  savingsModal.style.display = "none";
};

window.onclick = (e) => {
  if (e.target === savingsModal) {
    savingsModal.style.display = "none";
  }
};


// ================= LOAD MEMBERS =================
async function loadMembers() {
  const snap = await getDocs(membersRef);

  members = snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));
}

loadMembers();


// ================= SEARCH MEMBERS =================
searchMember.addEventListener("input", () => {

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

  filtered.slice(0, 5).forEach(m => {

    const div = document.createElement("div");

    div.className = "search-item";

    div.innerHTML = `
      <strong>${m.name}</strong><br>
      📞 ${m.phone}
    `;

    div.onclick = () => {

      selectedMemberData = m;

      selectedMember.innerHTML = `
        👤 <b>${m.name}</b><br>
        📞 ${m.phone}<br>
        💰 Previous: ${m.previousSaving || 0} ETB<br>
        💰 Total: ${m.savings || 0} ETB
      `;

      searchMember.value = m.name;
      searchResults.style.display = "none";
    };

    searchResults.style.display = "block";
    searchResults.appendChild(div);
  });
});


// ================= CLOSE SEARCH =================
document.addEventListener("click", (e) => {
  if (!searchMember.contains(e.target) && !searchResults.contains(e.target)) {
    searchResults.style.display = "none";
  }
});


// ================= ONLY NUMBERS =================
amountInput.addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/\D/g, "");
});


// ================= SAVE SAVINGS =================
savingsForm.addEventListener("submit", async (e) => {
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

  const previousSaving = selectedMemberData.savings || 0;
  const totalSaving = previousSaving + amount;

  const user = auth.currentUser;

  try {

    // SAVE TRANSACTION
    await addDoc(savingsRef, {
      memberId: selectedMemberData.id,
      memberName: selectedMemberData.name,
      phone: selectedMemberData.phone,
      amount,
      previousSaving,
      totalSaving,
      createdBy: user?.email || "Admin",
      createdDate: new Date().toLocaleDateString(),
      timestamp: serverTimestamp()
    });

    // UPDATE MEMBER
    await updateDoc(doc(db, "members", selectedMemberData.id), {
      previousSaving,
      savings: totalSaving
    });

    // RESET UI
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


// ================= REALTIME TABLE =================
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
      <td>${d.previousSaving} ETB</td>
      <td>${d.totalSaving} ETB</td>
      <td>${d.createdDate}</td>
      <td>${d.createdBy}</td>
    `;

    savingsTable.appendChild(tr);
  });

});
