import { db, auth } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ================= STATE ================= */
let members = [];
let savings = [];
let loans = [];
let editId = null;

/* ================= ELEMENTS ================= */
const table = document.getElementById("membersTable");
const form = document.getElementById("memberForm");
const search = document.getElementById("searchInput");
const modal = document.getElementById("memberModal");
const profileModal = document.getElementById("profileModal");

/* ================= MODAL ================= */
window.openMemberModal = () => {
  modal.classList.add("active");
  form.reset();
  editId = null;
};

window.closeMemberModal = () => {
  modal.classList.remove("active");
};

/* CLOSE PROFILE (FIXED) */
const closeProfileBtn = document.getElementById("closeProfileBtn");
closeProfileBtn?.addEventListener("click", () => {
  profileModal.classList.remove("active");
});

window.addEventListener("click", (e) => {
  if (e.target === profileModal) {
    profileModal.classList.remove("active");
  }
});

/* ================= LOAD DATA ================= */
async function loadMembers() {
  const snap = await getDocs(collection(db, "members"));
  members = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  render(members);
}

async function loadSavings() {
  const snap = await getDocs(collection(db, "savings"));
  savings = snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function loadLoans() {
  const snap = await getDocs(collection(db, "loans"));
  loans = snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/* ================= RENDER ================= */
function render(data) {
  table.innerHTML = "";

  data.forEach(m => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${m.fullName}</td>
      <td>${m.memberId}</td>
      <td>${m.phone}</td>
      <td>${m.gender}</td>
      <td>${m.status || "Active"}</td>
      <td>${m.createdAt?.toDate?.().toLocaleDateString() || "-"}</td>
      <td>${m.createdBy || "-"}</td>
      <td>
        <button onclick="editMember('${m.id}')">✏️</button>
        <button onclick="deleteMember('${m.id}')">🗑️</button>
        <button onclick="openProfile('${m.id}')">👁</button>
      </td>
    `;

    table.appendChild(tr);
  });
}

/* ================= ADD / EDIT ================= */
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    fullName: fullName.value,
    memberId: memberId.value,
    phone: phone.value,
    gender: gender.value,
    address: address.value,
    status: "Active",
    createdBy: auth.currentUser?.displayName || "Admin"
  };

  if (editId) {
    await updateDoc(doc(db, "members", editId), data);
  } else {
    data.createdAt = serverTimestamp();
    await addDoc(collection(db, "members"), data);
  }

  modal.classList.remove("active");
  loadMembers();
});

/* ================= DELETE ================= */
window.deleteMember = async (id) => {
  if (!confirm("Delete member?")) return;
  await deleteDoc(doc(db, "members", id));
  loadMembers();
};

/* ================= EDIT ================= */
window.editMember = (id) => {
  const m = members.find(x => x.id === id);

  fullName.value = m.fullName;
  memberId.value = m.memberId;
  phone.value = m.phone;
  gender.value = m.gender;
  address.value = m.address;

  editId = id;
  modal.classList.add("active");
};

/* ================= PROFILE (FIXED) ================= */
window.openProfile = function (memberId) {

  const member = members.find(m => m.id === memberId);

  profileModal.classList.add("active");

  document.getElementById("profileName").innerText = member.fullName;
  document.getElementById("profileNid").innerText = member.memberId;
  document.getElementById("profilePhone").innerText = member.phone;
  document.getElementById("profileGender").innerText = member.gender;
  document.getElementById("profileAddress").innerText = member.address;
  document.getElementById("profileStatus").innerText = member.status || "Active";

  /* FILTER DATA */
  const memberSavings = savings.filter(s => s.memberId === member.memberId);
  const memberLoans = loans.filter(l => l.memberId === member.memberId);

  const totalSavings = memberSavings.reduce((a, b) => a + Number(b.amount || 0), 0);
  const totalLoans = memberLoans.reduce((a, b) => a + Number(b.amount || 0), 0);

  document.getElementById("profileSavings").innerText = totalSavings;
  document.getElementById("profileLoans").innerText = totalLoans;
  document.getElementById("profileRemaining").innerText = totalLoans - totalSavings;

  /* TRANSACTIONS */
  const tx = document.getElementById("profileTransactions");
  tx.innerHTML = "";

  const all = [
    ...memberSavings.map(s => ({
      type: "Savings",
      amount: s.amount,
      status: s.status || "Done",
      date: s.createdAt?.toDate?.().toLocaleDateString() || "-",
      by: s.createdBy || "-"
    })),
    ...memberLoans.map(l => ({
      type: "Loan",
      amount: l.amount,
      status: l.status || "Active",
      date: l.createdAt?.toDate?.().toLocaleDateString() || "-",
      by: l.createdBy || "-"
    }))
  ];

  all.forEach(t => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${t.type}</td>
      <td>${t.amount}</td>
      <td>-</td>
      <td>-</td>
      <td>${t.status}</td>
      <td>${t.date}</td>
      <td>${t.by}</td>
    `;
    tx.appendChild(tr);
  });
};

/* ================= SEARCH ================= */
search.addEventListener("input", () => {
  const v = search.value.toLowerCase();

  render(
    members.filter(m =>
      m.fullName.toLowerCase().includes(v) ||
      m.phone.includes(v) ||
      m.memberId.includes(v)
    )
  );
});

/* ================= INIT ================= */
async function init() {
  await loadMembers();
  await loadSavings();
  await loadLoans();
}

init();
