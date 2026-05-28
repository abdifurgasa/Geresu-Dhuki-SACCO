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
     localStorage.getItem("name") ||
     auth.currentUser?.displayName ||
     "Admin"

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

```javascript
// =========================================================
// PROFILE MODAL
// =========================================================

const profileModal =
  document.getElementById("profileModal");

const closeProfileBtn =
  document.getElementById("closeProfileBtn");

const historyContainer =
  document.getElementById("historyContainer");

const historyTable =
  document.getElementById("historyTable");

let transactionPage = 1;

let loadingTransactions = false;

let hasMoreTransactions = true;

let currentMemberId = null;

// =========================================================
// OPEN PROFILE MODAL
// =========================================================

async function openProfileModal(memberId) {

  currentMemberId = memberId;

  profileModal.classList.add("active");

  historyTable.innerHTML = "";

  transactionPage = 1;

  hasMoreTransactions = true;

  // FIND MEMBER
  const member = members.find(
    m => m.id === memberId
  );

  // PROFILE TITLE
  document.getElementById(
    "profileTitle"
  ).innerHTML =
    `👤 ${member.name}`;

  // SUMMARY CARDS
  document.getElementById(
    "profileSavings"
  ).innerHTML =
    `ETB ${member.totalSavings}`;

  document.getElementById(
    "profileLoans"
  ).innerHTML =
    `ETB ${member.totalLoans}`;

  document.getElementById(
    "profileRemaining"
  ).innerHTML =
    `ETB ${member.remainingLoan}`;

  // LOAD FIRST TRANSACTIONS
  await loadTransactions();
}

// =========================================================
// CLOSE PROFILE
// =========================================================

closeProfileBtn.onclick = () => {

  profileModal.classList.remove("active");

};

// =========================================================
// LOAD TRANSACTIONS
// =========================================================

async function loadTransactions() {

  if (
    loadingTransactions ||
    !hasMoreTransactions
  ) return;

  loadingTransactions = true;

  document.getElementById(
    "loadingTransactions"
  ).style.display = "block";

  // =====================================================
  // API REQUEST EXAMPLE
  // =====================================================

  // const response = await fetch(
  //   `/api/members/${currentMemberId}/transactions?page=${transactionPage}`
  // );

  // const data = await response.json();

  // =====================================================
  // DEMO DATA
  // =====================================================

  const data = [];

  for (let i = 0; i < 20; i++) {

    data.push({

      type:
        i % 2 === 0
          ? "Saving Deposit"
          : "Loan Payment",

      amount: 5000 + i * 100,

      previous: 45000 + i * 100,

      total: 50000 + i * 100,

      status: "Completed",

      createdDate: "2026-05-28",

      createdBy: "Admin"

    });

  }

  // =====================================================
  // APPEND ROWS
  // =====================================================

  data.forEach(tx => {

    historyTable.innerHTML += `

      <tr>

        <td>${tx.type}</td>

        <td>
          ETB ${tx.amount}
        </td>

        <td>
          ETB ${tx.previous}
        </td>

        <td>
          ETB ${tx.total}
        </td>

        <td>
          ${tx.status}
        </td>

        <td>
          ${tx.createdDate}
        </td>

        <td>
          ${tx.createdBy}
        </td>

      </tr>

    `;

  });

  // UPDATE TRANSACTION COUNT
  document.getElementById(
    "profileTransactions"
  ).innerHTML =
    historyTable.children.length;

  transactionPage++;

  // STOP AFTER MANY PAGES
  if (transactionPage > 10) {

    hasMoreTransactions = false;

  }

  loadingTransactions = false;

  document.getElementById(
    "loadingTransactions"
  ).style.display = "none";
}

// =========================================================
// INFINITE SCROLL UPWARD
// =========================================================

historyContainer.addEventListener(
  "scroll",
  async () => {

    if (
      historyContainer.scrollTop <= 50
    ) {

      await loadTransactions();

    }

  }
);

// =========================================================
// CLICKABLE MEMBER ROWS
// =========================================================

function renderMembersTable() {

  const table =
    document.getElementById(
      "membersTable"
    );

  table.innerHTML = "";

  members.forEach(member => {

    table.innerHTML += `

      <tr
        class="member-row"
        onclick="openProfileModal(${member.id})"
      >

        <td>${member.name}</td>

        <td>${member.phone}</td>

        <td>${member.nid}</td>

        <td>
          ETB ${member.totalSavings}
        </td>

        <td>
          ETB ${member.totalLoans}
        </td>

        <td>
          ETB ${member.remainingLoan}
        </td>

        <td>
          ${member.status}
        </td>

        <td>
          ${member.createdDate}
        </td>

        <td>
          ${member.createdBy}
        </td>

      </tr>

    `;

  });

}
```

/* =========================================================
   START
========================================================= */

loadMembers();
