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
window.openProfile = async (id) => {

  const m = members.find(x => x.id === id);

  profileName.innerText = m.fullName;
  profileNid.innerText = m.memberId;
  profilePhone.innerText = m.phone;
  profileGender.innerText = m.gender;
  profileAddress.innerText = m.address;
  profileStatus.innerText = m.status;

  document.getElementById("profileModal").classList.add("active");

  const transactions = await loadTransactions(m.memberId);

  const tbody = document.getElementById("profileTransactions");
  tbody.innerHTML = "";

  let savings = 0;
  let loans = 0;
  let repaid = 0;

  transactions.forEach(t => {

    if (t.type === "savings") savings += Number(t.amount);
    if (t.type === "loans") loans += Number(t.amount);
    if (t.type === "repayments") repaid += Number(t.amount);

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${t.type}</td>
      <td>${t.amount}</td>
      <td>${t.previous}</td>
      <td>${t.total}</td>
      <td>${t.status}</td>
      <td>${
        t.createdAt?.toDate
          ? t.createdAt.toDate().toLocaleDateString()
          : "-"
      }</td>
      <td>${t.createdBy}</td>
    `;

    tbody.appendChild(tr);
  });

  profileSavings.innerText = savings;
  profileLoans.innerText = loans;
  profileRemaining.innerText = loans - repaid;
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
