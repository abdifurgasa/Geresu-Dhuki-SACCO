import { db, auth } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================
STATE
========================= */

let members = [];
let savings = [];
let selectedMember = null;
let editingId = null;

/* =========================
ELEMENTS
========================= */

const savingForm = document.getElementById("savingForm");
const savingsTable = document.getElementById("savingsTable");
const searchInput = document.getElementById("searchInput");

/* =========================
LOAD MEMBERS
========================= */

async function loadMembers() {

  const q = query(collection(db, "members"), orderBy("fullName"));
  const snap = await getDocs(q);

  members = [];

  snap.forEach(d => {
    members.push({ id: d.id, ...d.data() });
  });
}

/* =========================
SEARCH MEMBER
========================= */

searchInput.addEventListener("input", () => {

  const value = searchInput.value.toLowerCase();
  const box = document.getElementById("searchResults");

  box.innerHTML = "";

  if (!value) return;

  const filtered = members.filter(m =>
    m.fullName?.toLowerCase().includes(value) ||
    m.phone?.includes(value) ||
    m.memberId?.includes(value)
  );

  filtered.forEach(m => {

    const div = document.createElement("div");

    div.className = "search-item";

    div.innerHTML = `
      <strong>${m.fullName}</strong><br>
      ${m.phone}
    `;

    div.onclick = () => {

      selectedMember = m;

      document.getElementById("selectedMember").innerHTML =
        `👤 ${m.fullName}`;

      box.innerHTML = "";
      searchInput.value = "";

    };

    box.appendChild(div);

  });

});

/* =========================
LOAD SAVINGS
========================= */

async function loadSavings() {

  const q = query(collection(db, "savings"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  savings = [];

  snap.forEach(d => {
    savings.push({ id: d.id, ...d.data() });
  });

  render();
}

/* =========================
RENDER TABLE (WITH EDIT/DELETE)
========================= */

function render() {

  savingsTable.innerHTML = "";

  savings.forEach((s) => {

    const history = savings
      .filter(x => x.memberId === s.memberId)
      .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));

    let previous = 0;

    for (let item of history) {
      if (item.id === s.id) break;
      previous += Number(item.amount || 0);
    }

    const total = previous + Number(s.amount || 0);

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${s.memberName}</td>
      <td>${s.phone}</td>
      <td>${s.amount}</td>
      <td>${previous}</td>
      <td>${total}</td>
      <td>${s.createdAt?.toDate().toLocaleDateString() || "-"}</td>

      <td>

        <button class="edit-btn" onclick="editSaving('${s.id}')">
          ✏️
        </button>

        <button class="delete-btn" onclick="deleteSaving('${s.id}')">
          🗑️
        </button>

      </td>
    `;

    tr.onclick = (e) => {
      if (e.target.closest("button")) return;
      openProfile(s.memberId);
    };

    savingsTable.appendChild(tr);

  });
}

/* =========================
ADD + UPDATE SAVING
========================= */

savingForm.addEventListener("submit", async (e) => {

  e.preventDefault();

  if (!selectedMember) {
    alert("Select member first");
    return;
  }

  const amount = Number(document.getElementById("amount").value);

  if (!amount || amount <= 0) {
    alert("Invalid amount");
    return;
  }

  const payload = {
    memberId: selectedMember.memberId,
    memberName: selectedMember.fullName,
    phone: selectedMember.phone,
    amount,
    createdBy: auth.currentUser?.displayName || "Admin"
  };

  try {

    if (editingId) {

      await updateDoc(doc(db, "savings", editingId), payload);

      alert("Updated successfully");

      editingId = null;

      document.querySelector("#savingForm button").innerHTML =
        "Save";

    } else {

      payload.createdAt = serverTimestamp();

      await addDoc(collection(db, "savings"), payload);

      alert("Added successfully");

    }

    savingForm.reset();
    selectedMember = null;

    document.getElementById("selectedMember").innerHTML =
      "👤 Select member";

    loadSavings();

  } catch (err) {
    alert(err.message);
  }

});

/* =========================
EDIT SAVING
========================= */

window.editSaving = function (id) {

  const saving = savings.find(s => s.id === id);

  if (!saving) return;

  editingId = id;

  document.getElementById("amount").value = saving.amount;

  selectedMember = {
    memberId: saving.memberId,
    fullName: saving.memberName,
    phone: saving.phone
  };

  document.getElementById("selectedMember").innerHTML =
    `👤 ${saving.memberName}`;

  document.querySelector("#savingForm button").innerHTML =
    "Update Saving";

  window.scrollTo({ top: 0, behavior: "smooth" });

};

/* =========================
DELETE SAVING
========================= */

window.deleteSaving = async function (id) {

  if (!confirm("Delete this saving?")) return;

  await deleteDoc(doc(db, "savings", id));

  loadSavings();

};

/* =========================
PROFILE (FULL HISTORY)
========================= */

window.openProfile = function (memberId) {

  const list = savings.filter(s => s.memberId === memberId);

  let total = 0;

  document.getElementById("profileModal").classList.add("active");

  document.getElementById("profileName").innerText =
    list[0]?.memberName || "Profile";

  let html = "";

  list.forEach(s => {

    total += Number(s.amount);

    html += `
      <tr>
        <td>${s.createdAt?.toDate().toLocaleDateString()}</td>
        <td>${s.amount}</td>
        <td>${s.createdBy}</td>
      </tr>
    `;
  });

  document.getElementById("savingHistory").innerHTML = html;
  document.getElementById("profileTotalSaving").innerText = total;

};

/* =========================
INIT
========================= */

loadMembers();
loadSavings();
