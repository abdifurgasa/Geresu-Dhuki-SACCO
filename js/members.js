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

  /* =====================================================
     LOAD SAVINGS
  ===================================================== */

  const savingsSnap = await getDocs(
    collection(db, "savings")
  );

  savingsSnap.forEach(doc => {

    const d = doc.data();

    if (d.memberId === member.id) {

      totalSavings += Number(d.amount || 0);

      all.push({
        type: "Savings",
        amount: d.amount || 0,
        action: "Deposit",
        description: "Saving Deposit",
        createdAt: d.createdAt || null,
        createdBy: d.createdBy || member.name
      });

    }

  });

  /* =====================================================
     LOAD LOANS
  ===================================================== */

  const loansSnap = await getDocs(
    collection(db, "loans")
  );

  loansSnap.forEach(doc => {

    const d = doc.data();

    if (d.memberId === member.id) {

      totalLoans += Number(d.amount || 0);

      all.push({
        type: "Loan",
        amount: d.amount || 0,
        action: "Loan",
        description: "Loan Created",
        createdAt: d.createdAt || null,
        createdBy: d.createdBy || member.name
      });

    }

  });

  /* =====================================================
     LOAD REPAYMENTS
  ===================================================== */

  const repaySnap = await getDocs(
    collection(db, "repayments")
  );

  repaySnap.forEach(doc => {

    const d = doc.data();

    if (d.memberId === member.id) {

      totalRepayments += Number(d.amount || 0);

      all.push({
        type: "Repayment",
        amount: d.amount || 0,
        action: "Repayment",
        description: "Loan Repayment",
        createdAt: d.createdAt || null,
        createdBy: d.createdBy || member.name
      });

    }

  });

  /* =====================================================
     LOAD WITHDRAWALS
  ===================================================== */

  const withdrawSnap = await getDocs(
    collection(db, "withdrawals")
  );

  withdrawSnap.forEach(doc => {

    const d = doc.data();

    if (d.memberId === member.id) {

      totalWithdrawals += Number(d.amount || 0);

      all.push({
        type: "Withdrawal",
        amount: d.amount || 0,
        action: "Withdrawal",
        description: "Money Withdrawal",
        createdAt: d.createdAt || null,
        createdBy: d.createdBy || member.name
      });

    }

  });

  /* =====================================================
     DISPLAY TOTALS
  ===================================================== */

  document.getElementById("profileSavings").innerHTML =
    totalSavings.toLocaleString() + " ETB";

  document.getElementById("profileLoans").innerHTML =
    totalLoans.toLocaleString() + " ETB";

  document.getElementById("profileRepayments").innerHTML =
    totalRepayments.toLocaleString() + " ETB";

  document.getElementById("profileWithdrawals").innerHTML =
    totalWithdrawals.toLocaleString() + " ETB";

  /* =====================================================
     SORT LATEST FIRST
  ===================================================== */

  all.sort((a, b) => {

    const aTime = a.createdAt?.seconds || 0;
    const bTime = b.createdAt?.seconds || 0;

    return bTime - aTime;

  });

  /* =====================================================
     NO DATA
  ===================================================== */

  if (all.length === 0) {

    historyTable.innerHTML = `
      <tr>
        <td colspan="6"
          style="
            text-align:center;
            padding:30px;
            font-weight:bold;
            color:gray;
          ">
          No Transaction History
        </td>
      </tr>
    `;

    return;
  }

  /* =====================================================
     DISPLAY HISTORY
  ===================================================== */

  all.forEach(item => {

    const row = document.createElement("tr");

    row.innerHTML = `

      <td class="type-${item.type.toLowerCase()}">
        ${item.type}
      </td>

      <td>
        ${Number(item.amount).toLocaleString()} ETB
      </td>

      <td>
        ${item.action}
      </td>

      <td>
        ${item.description}
      </td>

      <td>
        ${
          item.createdAt
            ? new Date(
                item.createdAt.seconds * 1000
              ).toLocaleString()
            : "-"
        }
      </td>

      <td>
        ${item.createdBy}
      </td>

    `;

    historyTable.appendChild(row);

  });

}
/* =========================================================
   START
========================================================= */

loadMembers();
