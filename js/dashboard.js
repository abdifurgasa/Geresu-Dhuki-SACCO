import { db } from "./firebase.js";

import {
  collection,
  getDocs
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================================================
   CARD ELEMENTS
========================================================= */

const membersEl =
  document.getElementById("members");

const savingsEl =
  document.getElementById("savings");

const loansEl =
  document.getElementById("loans");

const withdrawalsEl =
  document.getElementById("withdrawals");

const profitEl =
  document.getElementById("profit");

/* =========================================================
   LOAD DASHBOARD
========================================================= */

async function loadDashboard() {

  try {

    /* =====================================================
       FETCH DATA
    ===================================================== */

    const membersSnap =
      await getDocs(
        collection(db, "members")
      );

    const savingsSnap =
      await getDocs(
        collection(db, "savings")
      );

    const loansSnap =
      await getDocs(
        collection(db, "loans")
      );

    const withdrawalsSnap =
      await getDocs(
        collection(db, "withdrawals")
      );

    const repaymentsSnap =
      await getDocs(
        collection(db, "repayments")
      );

    /* =====================================================
       MEMBERS
    ===================================================== */

    const totalMembers =
      membersSnap.size;

    membersEl.textContent =
      totalMembers;

    /* =====================================================
       SAVINGS
    ===================================================== */

    let totalSavings = 0;

    savingsSnap.forEach((doc) => {

      const data = doc.data();

      totalSavings +=
        Number(data.amount || 0);

    });

    savingsEl.textContent =
      totalSavings.toLocaleString() +
      " ETB";

    /* =====================================================
       LOANS
    ===================================================== */

    let totalLoans = 0;

    loansSnap.forEach((doc) => {

      const data = doc.data();

      totalLoans +=
        Number(data.amount || 0);

    });

    loansEl.textContent =
      totalLoans.toLocaleString() +
      " ETB";

    /* =====================================================
       WITHDRAWALS
    ===================================================== */

    let totalWithdrawals = 0;

    withdrawalsSnap.forEach((doc) => {

      const data = doc.data();

      totalWithdrawals +=
        Number(data.amount || 0);

    });

    withdrawalsEl.textContent =
      totalWithdrawals.toLocaleString() +
      " ETB";

    /* =====================================================
       REPAYMENTS
    ===================================================== */

    let totalRepayments = 0;

    repaymentsSnap.forEach((doc) => {

      const data = doc.data();

      totalRepayments +=
        Number(data.amount || 0);

    });

    /* =====================================================
       NET PROFIT
    ===================================================== */

    const profit =
      totalRepayments -
      totalWithdrawals;

    profitEl.textContent =
      profit.toLocaleString() +
      " ETB";

    /* =====================================================
       LOAD CHART
    ===================================================== */

    loadChart(
      totalSavings,
      totalLoans,
      totalWithdrawals,
      totalRepayments
    );

  }

  catch (error) {

    console.error(error);

  }

}

/* =========================================================
   CHART
========================================================= */

function loadChart(
  savings,
  loans,
  withdrawals,
  repayments
) {

  const ctx =
    document
    .getElementById("financeChart");

  if (!ctx) return;

  new Chart(ctx, {

    type: "bar",

    data: {

      labels: [

        "Savings",
        "Loans",
        "Withdrawals",
        "Repayments"

      ],

      datasets: [{

        label: "ETB",

        data: [

          savings,
          loans,
          withdrawals,
          repayments

        ],

        backgroundColor: [

          "#0ea5e9",
          "#22c55e",
          "#ef4444",
          "#f59e0b"

        ],

        borderRadius: 12

      }]

    },

    options: {

      responsive: true,

      plugins: {

        legend: {

          display: false

        }

      },

      scales: {

        y: {

          beginAtZero: true

        }

      }

    }

  });

}

/* =========================================================
   START
========================================================= */

loadDashboard();
