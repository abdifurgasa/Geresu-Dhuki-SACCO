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

/* ===================== ELEMENTS ===================== */
const form = document.getElementById("memberForm");
const table = document.getElementById("membersTable");
const search = document.getElementById("searchInput");
const exportBtn = document.getElementById("exportBtn");

/* ===================== STATE ===================== */
let members = [];
let editId = null;

/* ===================== MODALS ===================== */
window.openMemberModal = () => {
  document.getElementById("memberModal").classList.add("active");
  document.getElementById("modalTitle").innerText = "Add Member";
  form.reset();
  editId = null;
};

window.closeMemberModal = () => {
  document.getElementById("memberModal").classList.remove("active");
};

window.closeProfileModal = () => {
  document.getElementById("profileModal").classList.remove("active");
};

/* ===================== LOAD MEMBERS ===================== */
async function loadMembers() {
  const snap = await getDocs(collection(db, "members"));

  members = snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));

  render(members);
}

/* ===================== RENDER ===================== */
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
        <button onclick="deleteMember('${m.id}')">🗑</button>
        <button onclick="openProfile('${m.id}')">👁</button>
      </td>
    `;

    table.appendChild(tr);
  });
}

/* ===================== ADD / EDIT ===================== */
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

/* ===================== EDIT ===================== */
window.editMember = (id) => {
  const m = members.find(x => x.id === id);

  fullName.value = m.fullName;
  memberId.value = m.memberId;
  phone.value = m.phone;
  gender.value = m.gender;
  address.value = m.address;

  editId = id;

  document.getElementById("modalTitle").innerText = "Edit Member";
  openMemberModal();
};

/* ===================== DELETE ===================== */
window.deleteMember = async (id) => {
  if (!confirm("Delete member?")) return;

  await deleteDoc(doc(db, "members", id));
  loadMembers();
};

/* ===================== PROFILE ===================== */
window.openProfile = (id) => {
  const m = members.find(x => x.id === id);

  profileName.innerText = m.fullName;
  profileNid.innerText = m.memberId;
  profilePhone.innerText = m.phone;
  profileGender.innerText = m.gender;
  profileAddress.innerText = m.address;
  profileStatus.innerText = m.status || "Active";

  document.getElementById("profileModal").classList.add("active");
};

/* ===================== SEARCH ===================== */
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

/* ===================== EXPORT ===================== */
exportBtn.onclick = () => {
  let csv = "Name,NID,Phone,Gender,Status,CreatedAt,CreatedBy\n";

  members.forEach(m => {
    csv += `${m.fullName},${m.memberId},${m.phone},${m.gender},${m.status},${m.createdAt},${m.createdBy}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "members.csv";
  a.click();
};

/* ===================== INIT ===================== */
loadMembers();
