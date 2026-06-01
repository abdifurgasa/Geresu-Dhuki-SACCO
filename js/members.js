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
let editId = null;

/* ================= ELEMENTS ================= */
const table = document.getElementById("membersTable");
const form = document.getElementById("memberForm");
const search = document.getElementById("searchInput");

/* ================= MODAL CONTROL ================= */
window.openMemberModal = () => {
  document.getElementById("memberModal").classList.add("active");
  form.reset();
  editId = null;
};

window.closeMemberModal = () => {
  document.getElementById("memberModal").classList.remove("active");
};

window.closeProfileModal = () => {
  document.getElementById("profileModal").classList.remove("active");
};

/* ================= LOAD MEMBERS ================= */
async function loadMembers() {
  const snap = await getDocs(collection(db, "members"));

  members = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  render(members);
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
      <td>${
        m.createdAt?.toDate
          ? m.createdAt.toDate().toLocaleDateString()
          : "-"
      }</td>
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

  closeMemberModal();
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
  openMemberModal();
};

/* ================= TRANSACTIONS ================= */
async function loadTransactions(memberId) {

  const collections = ["savings", "loans", "repayments", "withdrawals"];

  let all = [];

  for (let c of collections) {
    const snap = await getDocs(collection(db, c));

    snap.forEach(d => {
      const x = d.data();

      if (x.memberId === memberId) {
        all.push({
          type: c,
          amount: x.amount || 0,
          previous: x.previous || 0,
          total: x.total || 0,
          status: x.status || "Done",
          createdAt: x.createdAt,
          createdBy: x.createdBy || "-"
        });
      }
    });
  }

  return all;
}

/* ================= PROFILE ================= */
window.openProfile = function (member) {
  profileModal.classList.add("active");

  // BASIC INFO
  document.getElementById("profileName").innerText = member.fullName;
  document.getElementById("profileNid").innerText = member.memberId;
  document.getElementById("profilePhone").innerText = member.phone;
  document.getElementById("profileGender").innerText = member.gender;
  document.getElementById("profileAddress").innerText = member.address;
  document.getElementById("profileStatus").innerText = member.status || "Active";

  // FILTER DATA FROM GLOBAL ARRAYS
  const memberSavings = savings.filter(s => s.memberId === member.memberId);
  const memberLoans = loans.filter(l => l.memberId === member.memberId);

  // TOTAL CALCULATION
  const totalSavings = memberSavings.reduce((sum, s) => sum + Number(s.amount || 0), 0);
  const totalLoans = memberLoans.reduce((sum, l) => sum + Number(l.amount || 0), 0);
  const remaining = totalLoans - totalSavings;

  document.getElementById("profileSavings").innerText = totalSavings;
  document.getElementById("profileLoans").innerText = totalLoans;
  document.getElementById("profileRemaining").innerText = remaining;

  // TRANSACTIONS TABLE (IMPORTANT FIX)
  const txBox = document.getElementById("profileTransactions");
  txBox.innerHTML = "";

  const transactions = [
    ...memberSavings.map(s => ({
      type: "Savings",
      amount: s.amount,
      prev: "-",
      total: "-",
      status: s.status || "Done",
      date: s.createdAt?.toDate?.().toLocaleDateString() || "-",
      by: s.createdBy || "-"
    })),
    ...memberLoans.map(l => ({
      type: "Loan",
      amount: l.amount,
      prev: "-",
      total: "-",
      status: l.status || "Active",
      date: l.createdAt?.toDate?.().toLocaleDateString() || "-",
      by: l.createdBy || "-"
    }))
  ];

  transactions.forEach(t => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${t.type}</td>
      <td>${t.amount}</td>
      <td>${t.prev}</td>
      <td>${t.total}</td>
      <td>${t.status}</td>
      <td>${t.date}</td>
      <td>${t.by}</td>
    `;
    txBox.appendChild(tr);
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
loadMembers();
