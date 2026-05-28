import { db, auth } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================================================
   GLOBAL STATE
========================================================= */

let members = [];
let currentMemberId = null;

/* =========================================================
   ELEMENTS
========================================================= */

const membersTable = document.getElementById("membersTable");

const memberModal = document.getElementById("memberModal");
const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

const memberForm = document.getElementById("memberForm");

/* PROFILE */
const profileModal = document.getElementById("profileModal");
const closeProfileBtn = document.getElementById("closeProfileBtn");
const historyTable = document.getElementById("historyTable");
const historyContainer = document.getElementById("historyContainer");

/* =========================================================
   OPEN / CLOSE MODAL
========================================================= */

openModalBtn?.addEventListener("click", () => {
  memberModal.style.display = "flex";
});

closeModalBtn?.addEventListener("click", () => {
  memberModal.style.display = "none";
});

closeProfileBtn?.addEventListener("click", () => {
  profileModal.classList.remove("active");
});

/* =========================================================
   ADD MEMBER (WITH VALIDATION + DUPLICATE CHECK)
========================================================= */

memberForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {

    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const nid = document.getElementById("nid").value.trim();

    /* =========================
       VALIDATION
    ========================= */

    if (!name) {
      return alert("Name is required");
    }

    if (!/^\d{9}$/.test(phone)) {
      return alert("Phone number must be EXACTLY 9 digits");
    }

    if (!/^\d{16}$/.test(nid)) {
      return alert("National ID must be EXACTLY 16 digits");
    }

    /* =========================
       DUPLICATE CHECK (SAFE)
    ========================= */

    const phoneSnap = await getDocs(
      query(collection(db, "members"), where("phone", "==", phone))
    );

    if (!phoneSnap.empty) {
      return alert("Phone number already exists");
    }

    const nidSnap = await getDocs(
      query(collection(db, "members"), where("nid", "==", nid))
    );

    if (!nidSnap.empty) {
      return alert("NID already exists");
    }

    /* =========================
       SAVE MEMBER
    ========================= */

    await addDoc(collection(db, "members"), {
      name,
      phone,
      nid,
      status: "Active",
      createdAt: serverTimestamp(),
      createdBy:
        localStorage.getItem("name") ||
        auth.currentUser?.displayName ||
        "Admin"
    });

    memberForm.reset();
    memberModal.style.display = "none";

    loadMembers();

  } catch (err) {
    alert(err.message);
  }
});

/* =========================================================
   LOAD MEMBERS
========================================================= */

async function loadMembers() {

  members = [];
  membersTable.innerHTML = "";

  const snap = await getDocs(collection(db, "members"));

  for (const docSnap of snap.docs) {

    const m = docSnap.data();
    const id = docSnap.id;

    // SAVINGS
    const sSnap = await getDocs(
      query(collection(db, "savings"), where("memberId", "==", id))
    );

    let totalSavings = 0;
    sSnap.forEach(d => totalSavings += Number(d.data().amount || 0));

    // LOANS
    const lSnap = await getDocs(
      query(collection(db, "loans"), where("memberId", "==", id))
    );

    let totalLoans = 0;
    lSnap.forEach(d => totalLoans += Number(d.data().amount || 0));

    // REPAYMENTS
    const rSnap = await getDocs(
      query(collection(db, "repayments"), where("memberId", "==", id))
    );

    let totalRepayments = 0;
    rSnap.forEach(d => totalRepayments += Number(d.data().amount || 0));

    members.push({
      id,
      ...m,
      totalSavings,
      totalLoans,
      remainingLoan: totalLoans - totalRepayments
    });
  }

  renderMembers();
}

/* =========================================================
   RENDER TABLE
========================================================= */

function renderMembers() {

  membersTable.innerHTML = "";

  members.forEach(member => {

    const row = document.createElement("tr");

    row.className = "member-row";

    row.onclick = () => openProfile(member.id);

    row.innerHTML = `
      <td><strong>${member.name}</strong></td>
      <td>${member.phone}</td>
      <td>${member.nid}</td>
      <td>${member.totalSavings} ETB</td>
      <td>${member.totalLoans} ETB</td>
      <td>${member.remainingLoan} ETB</td>
      <td>${member.status}</td>
      <td>${
        member.createdAt
          ? new Date(member.createdAt.seconds * 1000).toLocaleString()
          : "-"
      }</td>
      <td>${member.createdBy || "-"}</td>
    `;

    membersTable.appendChild(row);
  });
}

/* =========================================================
   OPEN PROFILE (ONLY ON CLICK)
========================================================= */

async function openProfile(memberId) {

  currentMemberId = memberId;

  profileModal.classList.add("active");

  historyTable.innerHTML = "";

  const member = members.find(m => m.id === memberId);

  if (!member) return;

  document.getElementById("profileTitle").innerText =
    "👤 " + member.name;

  document.getElementById("profileSavings").innerText =
    "ETB " + member.totalSavings;

  document.getElementById("profileLoans").innerText =
    "ETB " + member.totalLoans;

  document.getElementById("profileRemaining").innerText =
    "ETB " + member.remainingLoan;

  await loadTransactions();
}

/* =========================================================
   LOAD TRANSACTIONS (DEMO)
========================================================= */

async function loadTransactions() {

  const data = [];

  for (let i = 0; i < 20; i++) {

    data.push({
      type: i % 2 === 0 ? "Saving" : "Loan",
      amount: 5000 + i * 100,
      previous: 45000 + i * 100,
      total: 50000 + i * 100,
      status: "Completed",
      createdDate: "2026-05-28",
      createdBy: "Admin"
    });
  }

  data.forEach(tx => {

    historyTable.innerHTML += `
      <tr>
        <td>${tx.type}</td>
        <td>${tx.amount}</td>
        <td>${tx.previous}</td>
        <td>${tx.total}</td>
        <td>${tx.status}</td>
        <td>${tx.createdDate}</td>
        <td>${tx.createdBy}</td>
      </tr>
    `;
  });

  document.getElementById("profileTransactions").innerText =
    historyTable.children.length;
}

/* =========================================================
   INIT
========================================================= */

loadMembers();
