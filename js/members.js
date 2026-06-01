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

const modal = document.getElementById("memberModal");
const profileModal = document.getElementById("profileModal");

/* ================= USER NAME FIX ================= */
function getUserName() {
  return (
    auth.currentUser?.displayName ||
    auth.currentUser?.email ||
    localStorage.getItem("userName") ||
    "Unknown User"
  );
}

/* ================= MODAL CONTROL ================= */
window.openMemberModal = () => {
  modal.classList.add("active");
  form.reset();
  editId = null;
};

window.closeMemberModal = () => {
  modal.classList.remove("active");
};

window.closeProfileModal = () => {
  profileModal.classList.remove("active");
};

/* ✅ FIX CLOSE X + OUTSIDE CLICK */
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal")) {
    e.target.classList.remove("active");
  }
});

/* ================= LOAD MEMBERS ================= */
async function loadMembers() {
  const snap = await getDocs(collection(db, "members"));

  members = snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));

  render(members);
}

/* ================= RENDER TABLE ================= */
function render(data) {
  table.innerHTML = "";

  data.forEach(m => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${m.fullName || "-"}</td>
      <td>${m.memberId || "-"}</td>
      <td>${m.phone || "-"}</td>
      <td>${m.gender || "-"}</td>
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
    createdBy: getUserName()
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
  if (!m) return;

  fullName.value = m.fullName || "";
  memberId.value = m.memberId || "";
  phone.value = m.phone || "";
  gender.value = m.gender || "Male";
  address.value = m.address || "";

  editId = id;
  openMemberModal();
};

/* ================= PROFILE ================= */
window.openProfile = async (id) => {
  const member = members.find(m => m.id === id);
  if (!member) return;

  profileModal.classList.add("active");

  document.getElementById("profileName").innerText = member.fullName;
  document.getElementById("profileNid").innerText = member.memberId;
  document.getElementById("profilePhone").innerText = member.phone;
  document.getElementById("profileGender").innerText = member.gender;
  document.getElementById("profileAddress").innerText = member.address;
  document.getElementById("profileStatus").innerText = member.status || "Active";

  await loadProfileTransactions(member.memberId);
};

/* ================= PROFILE TRANSACTIONS ================= */
async function loadProfileTransactions(memberId) {
  const collections = ["savings", "loans", "repayments", "withdrawals"];

  let transactions = [];

  for (let c of collections) {
    const snap = await getDocs(collection(db, c));

    snap.forEach(d => {
      const x = d.data();

      if (x.memberId === memberId) {
        transactions.push({
          type: c,
          amount: x.amount || 0,
          status: x.status || "Done",
          date: x.createdAt?.toDate?.().toLocaleDateString() || "-",
          by: x.createdBy || getUserName()
        });
      }
    });
  }

  const box = document.getElementById("profileTransactions");
  box.innerHTML = "";

  transactions.forEach(t => {
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

    box.appendChild(tr);
  });
}

/* ================= SEARCH ================= */
search.addEventListener("input", () => {
  const v = search.value.toLowerCase();

  render(
    members.filter(m =>
      (m.fullName || "").toLowerCase().includes(v) ||
      (m.phone || "").includes(v) ||
      (m.memberId || "").includes(v)
    )
  );
});

/* ================= INIT ================= */
loadMembers();
