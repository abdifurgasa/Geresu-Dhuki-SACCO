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
   OPEN/CLOSE MODAL
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

    console.error(err);

    alert(err.message);

  }

});

/* =========================================================
   LOAD MEMBERS
========================================================= */

async function loadMembers() {

  membersTable.innerHTML = "";

  const membersSnap = await getDocs(collection(db, "members"));

  const members = [];

  for (const docSnap of membersSnap.docs) {

    const member = docSnap.data();

    const memberId = docSnap.id;

    /* =========================
       TOTAL SAVINGS
    ========================= */

    const savingsSnap = await getDocs(
      query(
        collection(db, "savings"),
        where("memberId", "==", memberId)
      )
    );

    let totalSavings = 0;

    savingsSnap.forEach(doc => {
      totalSavings += Number(doc.data().amount || 0);
    });

    /* =========================
       TOTAL LOANS
    ========================= */

    const loansSnap = await getDocs(
      query(
        collection(db, "loans"),
        where("memberId", "==", memberId)
      )
    );

    let totalLoans = 0;

    loansSnap.forEach(doc => {
      totalLoans += Number(doc.data().amount || 0);
    });

    /* =========================
       TOTAL REPAYMENTS
    ========================= */

    const repaymentSnap = await getDocs(
      query(
        collection(db, "repayments"),
        where("memberId", "==", memberId)
      )
    );

    let totalRepayment = 0;

    repaymentSnap.forEach(doc => {
      totalRepayment += Number(doc.data().amount || 0);
    });

    /* =========================
       REMAINING LOAN
    ========================= */

    const remainingLoan = totalLoans - totalRepayment;

    members.push({

      id: memberId,

      ...member,

      totalSavings,
      totalLoans,
      remainingLoan

    });

  }

  /* =========================================================
     SORT LATEST FIRST
  ========================================================= */

  members.sort((a, b) => {

    const aTime = a.createdAt?.seconds || 0;
    const bTime = b.createdAt?.seconds || 0;

    return bTime - aTime;

  });

  /* =========================================================
     DISPLAY MEMBERS
  ========================================================= */

  members.forEach(member => {

    const row = document.createElement("tr");

    row.innerHTML = `

      <td>
        <strong>${member.name}</strong>
      </td>

      <td>${member.phone}</td>

      <td>${member.nid}</td>

      <td>
        ${member.totalSavings.toLocaleString()} ETB
      </td>

      <td>
        ${member.totalLoans.toLocaleString()} ETB
      </td>

      <td>
        ${member.remainingLoan.toLocaleString()} ETB
      </td>

      <td>
        <span class="status active">
          ${member.status}
        </span>
      </td>

      <td>
        ${
          member.createdAt
            ? new Date(
                member.createdAt.seconds * 1000
              ).toLocaleString()
            : "-"
        }
      </td>

      <td>
        ${member.createdBy || member.name}
      </td>

    `;

    row.style.cursor = "pointer";

    row.addEventListener("click", () => {
      openMemberProfile(member);
    });

    membersTable.appendChild(row);

  });

}

/* =========================================================
   MEMBER PROFILE
========================================================= */

async function openMemberProfile(member) {

  profileModal.style.display = "flex";

  document.getElementById("profileName").innerHTML =
    `👤 ${member.name}`;

  historyTable.innerHTML = "";

  /* =========================================================
     TOTALS
  ========================================================= */

  let totalSavings = 0;
  let totalLoans = 0;
  let totalRepayments = 0;
  let totalWithdrawals = 0;

  const allTransactions = [];

  /* =========================================================
     SAVINGS
  ========================================================= */

  const savingsSnap = await getDocs(
    query(
      collection(db, "savings"),
      where("memberId", "==", member.id)
    )
  );

  savingsSnap.forEach(docSnap => {

    const d = docSnap.data();

    totalSavings += Number(d.amount || 0);

    allTransactions.push({

      type: "Savings",

      amount: d.amount || 0,

      description: "Saving Deposit",

      createdAt: d.createdAt || null,

      createdBy:
        d.createdBy ||
        member.name,

      action: "Deposit"

    });

  });

  /* =========================================================
     LOANS
  ========================================================= */

  const loansSnap = await getDocs(
    query(
      collection(db, "loans"),
      where("memberId", "==", member.id)
    )
  );

  loansSnap.forEach(docSnap => {

    const d = docSnap.data();

    totalLoans += Number(d.amount || 0);

    allTransactions.push({

      type: "Loan",

      amount: d.amount || 0,

      description: "Loan Created",

      createdAt: d.createdAt || null,

      createdBy:
        d.createdBy ||
        member.name,

      action: "Loan"

    });

  });

  /* =========================================================
     REPAYMENTS
  ========================================================= */

  const repaymentSnap = await getDocs(
    query(
      collection(db, "repayments"),
      where("memberId", "==", member.id)
    )
  );

  repaymentSnap.forEach(docSnap => {

    const d = docSnap.data();

    totalRepayments += Number(d.amount || 0);

    allTransactions.push({

      type: "Repayment",

      amount: d.amount || 0,

      description: "Loan Repayment",

      createdAt: d.createdAt || null,

      createdBy:
        d.createdBy ||
        member.name,

      action: "Repayment"

    });

  });

  /* =========================================================
     WITHDRAWALS
  ========================================================= */

  const withdrawalSnap = await getDocs(
    query(
      collection(db, "withdrawals"),
      where("memberId", "==", member.id)
    )
  );

  withdrawalSnap.forEach(docSnap => {

    const d = docSnap.data();

    totalWithdrawals += Number(d.amount || 0);

    allTransactions.push({

      type: "Withdrawal",

      amount: d.amount || 0,

      description: "Money Withdrawal",

      createdAt: d.createdAt || null,

      createdBy:
        d.createdBy ||
        member.name,

      action: "Withdrawal"

    });

  });

  /* =========================================================
     DISPLAY TOTALS
  ========================================================= */

  document.getElementById("profileSavings").innerHTML =
    `${totalSavings.toLocaleString()} ETB`;

  document.getElementById("profileLoans").innerHTML =
    `${totalLoans.toLocaleString()} ETB`;

  document.getElementById("profileRepayments").innerHTML =
    `${totalRepayments.toLocaleString()} ETB`;

  document.getElementById("profileWithdrawals").innerHTML =
    `${totalWithdrawals.toLocaleString()} ETB`;

  /* =========================================================
     SORT BY LATEST FIRST
  ========================================================= */

  allTransactions.sort((a, b) => {

    const aTime = a.createdAt?.seconds || 0;
    const bTime = b.createdAt?.seconds || 0;

    return bTime - aTime;

  });

  /* =========================================================
     EMPTY STATE
  ========================================================= */

  if (allTransactions.length === 0) {

    historyTable.innerHTML = `

      <tr>
        <td colspan="6" style="
          text-align:center;
          padding:30px;
          font-weight:bold;
          color:gray;
        ">
          No Transactions Found
        </td>
      </tr>

    `;

    return;

  }

  /* =========================================================
     DISPLAY HISTORY
  ========================================================= */

  allTransactions.forEach(item => {

    const row = document.createElement("tr");

    row.innerHTML = `

      <td class="type-${item.type.toLowerCase()}">
        ${item.type}
      </td>

      <td>
        ${Number(item.amount).toLocaleString()} ETB
      </td>

      <td>
        ${item.description}
      </td>

      <td>
        ${item.action}
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
