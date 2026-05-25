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
   ELEMENTS
========================================================= */

const membersTable = document.getElementById("membersTable");

const memberForm = document.getElementById("memberForm");

const modal = document.getElementById("memberModal");

const openModalBtn = document.getElementById("openModalBtn");

const closeModalBtn = document.getElementById("closeModalBtn");

/* PROFILE MODAL */
const profileModal = document.getElementById("profileModal");
const closeProfileBtn = document.getElementById("closeProfileBtn");
const historyTable = document.getElementById("historyTable");

/* =========================================================
   OPEN / CLOSE MODAL
========================================================= */

openModalBtn?.addEventListener("click", () => {
  modal.style.display = "flex";
});

closeModalBtn?.addEventListener("click", () => {
  modal.style.display = "none";
});

closeProfileBtn?.addEventListener("click", () => {
  profileModal.style.display = "none";
});

/* =========================================================
   ADD MEMBER
========================================================= */

memberForm?.addEventListener("submit", async (e) => {

  e.preventDefault();

  try {

    const name = document.getElementById("name").value;
    const phone = document.getElementById("phone").value;
    const nid = document.getElementById("nid").value;

    await addDoc(collection(db, "members"), {

      name,
      phone,
      nid,

      status: "Active",
      createdAt: serverTimestamp(),

      createdBy:
        auth.currentUser?.displayName ||
        auth.currentUser?.email ||
        name

    });

    alert("Member Added Successfully");

    memberForm.reset();
    modal.style.display = "none";

    loadMembers();

  } catch (err) {
    alert(err.message);
  }

});

/* =========================================================
   LOAD MEMBERS
========================================================= */

async function loadMembers() {

  membersTable.innerHTML = "";

  const snap = await getDocs(collection(db, "members"));

  const members = [];

  for (const docSnap of snap.docs) {

    const m = docSnap.data();
    const id = docSnap.id;

    /* SAVINGS */
    const sSnap = await getDocs(query(collection(db, "savings"), where("memberId", "==", id)));
    let totalSavings = 0;
    sSnap.forEach(d => totalSavings += Number(d.data().amount || 0));

    /* LOANS */
    const lSnap = await getDocs(query(collection(db, "loans"), where("memberId", "==", id)));
    let totalLoans = 0;
    lSnap.forEach(d => totalLoans += Number(d.data().amount || 0));

    /* REPAYMENTS */
    const rSnap = await getDocs(query(collection(db, "repayments"), where("memberId", "==", id)));
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

  /* SORT LATEST */
  members.sort((a, b) =>
    (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
  );

  members.forEach(member => {

    const row = document.createElement("tr");

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
      <td>${member.createdBy || member.name}</td>
    `;

    row.style.cursor = "pointer";

    row.onclick = () => openMemberProfile(member);

    membersTable.appendChild(row);
  });
}

/* =========================================================
   PROFILE VIEW (FIXED - WORKING VERSION)
========================================================= */

async function openMemberProfile(member) {

  profileModal.style.display = "flex";

  document.getElementById("profileName").innerHTML =
    `👤 ${member.name}`;

  historyTable.innerHTML = "";

  let totalSavings = 0;
  let totalLoans = 0;
  let totalRepayments = 0;
  let totalWithdrawals = 0;

  const all = [];

  /* ================= SAVINGS ================= */
  const sSnap = await getDocs(query(collection(db, "savings"), where("memberId", "==", member.id)));
  sSnap.forEach(d => {
    const x = d.data();
    totalSavings += Number(x.amount || 0);

    all.push({
      type: "Savings",
      amount: x.amount || 0,
      action: "Deposit",
      desc: "Saving Deposit",
      time: x.createdAt,
      by: x.createdBy || member.name
    });
  });

  /* ================= LOANS ================= */
  const lSnap = await getDocs(query(collection(db, "loans"), where("memberId", "==", member.id)));
  lSnap.forEach(d => {
    const x = d.data();
    totalLoans += Number(x.amount || 0);

    all.push({
      type: "Loan",
      amount: x.amount || 0,
      action: "Loan",
      desc: "Loan Created",
      time: x.createdAt,
      by: x.createdBy || member.name
    });
  });

  /* ================= REPAYMENTS ================= */
  const rSnap = await getDocs(query(collection(db, "repayments"), where("memberId", "==", member.id)));
  rSnap.forEach(d => {
    const x = d.data();
    totalRepayments += Number(x.amount || 0);

    all.push({
      type: "Repayment",
      amount: x.amount || 0,
      action: "Repay",
      desc: "Loan Repayment",
      time: x.createdAt,
      by: x.createdBy || member.name
    });
  });

  /* ================= WITHDRAWALS ================= */
  const wSnap = await getDocs(query(collection(db, "withdrawals"), where("memberId", "==", member.id)));
  wSnap.forEach(d => {
    const x = d.data();
    totalWithdrawals += Number(x.amount || 0);

    all.push({
      type: "Withdrawal",
      amount: x.amount || 0,
      action: "Withdraw",
      desc: "Money Withdrawal",
      time: x.createdAt,
      by: x.createdBy || member.name
    });
  });

  /* ================= TOP SUMMARY ================= */

  document.getElementById("profileSavings").innerHTML =
    totalSavings + " ETB";

  document.getElementById("profileLoans").innerHTML =
    totalLoans + " ETB";

  document.getElementById("profileRepayments").innerHTML =
    totalRepayments + " ETB";

  document.getElementById("profileWithdrawals").innerHTML =
    totalWithdrawals + " ETB";

  /* ================= SORT LATEST ================= */

  all.sort((a, b) =>
    (b.time?.seconds || 0) - (a.time?.seconds || 0)
  );

  /* ================= EMPTY CHECK ================= */

  if (all.length === 0) {
    historyTable.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;padding:20px;">
          No Transactions Yet
        </td>
      </tr>
    `;
    return;
  }

  /* ================= RENDER ================= */

  all.forEach(t => {

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${t.type}</td>
      <td>${t.amount} ETB</td>
      <td>${t.action}</td>
      <td>${t.desc}</td>
      <td>${
        t.time
          ? new Date(t.time.seconds * 1000).toLocaleString()
          : "-"
      }</td>
      <td>${t.by}</td>
    `;

    historyTable.appendChild(row);
  });

}

/* =========================================================
   START
========================================================= */

loadMembers();
