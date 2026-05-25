import { db, auth } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================
   GET USER NAME (IMPORTANT)
========================= */
async function getUserName(uid) {
  if (!uid) return "Admin";

  const snap = await getDoc(doc(db, "users", uid));

  if (snap.exists()) {
    return snap.data().name || "Admin";
  }

  return "Admin";
}

/* =========================
   MODAL
========================= */
const modal = document.getElementById("memberModal");
document.getElementById("openModalBtn").onclick = () => modal.style.display = "flex";
document.getElementById("closeModalBtn").onclick = () => modal.style.display = "none";

/* =========================
   SAVE MEMBER
========================= */
document.getElementById("memberForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;
  const nid = document.getElementById("nid").value;

  try {

    // duplicate check
    const phoneCheck = await getDocs(query(collection(db, "members"), where("phone", "==", phone)));
    if (!phoneCheck.empty) return alert("Phone already exists");

    const nidCheck = await getDocs(query(collection(db, "members"), where("nid", "==", nid)));
    if (!nidCheck.empty) return alert("NID already exists");

    // get user
    const user = auth.currentUser;
    const createdByName = await getUserName(user?.uid);

    await addDoc(collection(db, "members"), {
      name,
      phone,
      nid,
      savings: 0,
      loanTotal: 0,
      loanRemaining: 0,
      status: "active",
      createdAt: serverTimestamp(),
      createdBy: createdByName
    });

    alert("Member saved");

    e.target.reset();
    modal.style.display = "none";

    loadMembers();

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
});

/* =========================
   LOAD MEMBERS TABLE
========================= */
async function loadMembers() {
  const table = document.getElementById("membersTable");
  table.innerHTML = "";

  const snap = await getDocs(collection(db, "members"));

  snap.forEach(doc => {
    const m = doc.data();

    table.innerHTML += `
      <tr>
        <td>${m.name}</td>
        <td>${m.phone}</td>
        <td>${m.nid}</td>
        <td>${m.savings}</td>
        <td>${m.loanTotal}</td>
        <td>${m.loanRemaining}</td>
        <td>${m.status}</td>
        <td>${m.createdAt ? new Date(m.createdAt.seconds * 1000).toLocaleDateString() : ""}</td>
        <td>${m.createdBy}</td>
      </tr>
    `;
  });
}

loadMembers();
