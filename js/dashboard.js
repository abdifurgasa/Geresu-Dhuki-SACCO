import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  query,
  orderBy,
  limit
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================================================
   CARD ELEMENTS
========================================================= */

const totalMembers =
  document.getElementById("totalMembers");

const totalSavings =
  document.getElementById("totalSavings");

const totalLoans =
  document.getElementById("totalLoans");

const totalRepayments =
  document.getElementById("totalRepayments");

const totalWithdrawals =
  document.getElementById("totalWithdrawals");

const activeLoans =
  document.getElementById("activeLoans");

/* =========================================================
   LOAD DASHBOARD
========================================================= */

async function loadDashboard() {

  try {

    /* =====================================================
       FETCH ALL COLLECTIONS
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

    const repaymentsSnap =
      await getDocs(
        collection(db, "repayments")
      );

    const withdrawalsSnap =
      await getDocs(
        collection(db, "withdrawals")
      );

    /* =====================================================
       MEMBERS
    ===================================================== */

    totalMembers.textContent =
      membersSnap.size;

    /* =====================================================
       SAVINGS TOTAL
    ===================================================== */

    let savingsTotal = 0;

    savingsSnap.forEach((doc) => {

      const data = doc.data();

      savingsTotal +=
        Number(data.amount || 0);

    });

    totalSavings.textContent =
      savingsTotal.toLocaleString();

    /* =====================================================
       LOANS TOTAL
    ===================================================== */

    let loansTotal = 0;

    let activeLoanCount = 0;

    loansSnap.forEach((doc) => {

      const data = doc.data();

      loansTotal +=
        Number(data.amount || 0);

      if (
        data.status === "active"
      ) {

        activeLoanCount++;

      }

    });

    totalLoans.textContent =
      loansTotal.toLocaleString();

    activeLoans.textContent =
      activeLoanCount;

    /* =====================================================
       REPAYMENTS TOTAL
    ===================================================== */

    let repaymentTotal = 0;

    repaymentsSnap.forEach((doc) => {

      const data = doc.data();

      repaymentTotal +=
        Number(data.amount || 0);

    });

    totalRepayments.textContent =
      repaymentTotal.toLocaleString();

    /* =====================================================
       WITHDRAWALS TOTAL
    ===================================================== */

    let withdrawalTotal = 0;

    withdrawalsSnap.forEach((doc) => {

      const data = doc.data();

      withdrawalTotal +=
        Number(data.amount || 0);

    });

    totalWithdrawals.textContent =
      withdrawalTotal.toLocaleString();

    /* =====================================================
       CHARTS
    ===================================================== */

    loadCharts(
      savingsTotal,
      loansTotal,
      repaymentTotal,
      withdrawalTotal
    );

    /* =====================================================
       RECENT ACTIVITIES
    ===================================================== */

    loadRecentActivities();

  }

  catch (error) {

    console.error(error);

  }

}

/* =========================================================
   LOAD CHARTS
========================================================= */

function loadCharts(
  savings,
  loans,
  repayments,
  withdrawals
) {

  /* BAR CHART */

  const barCtx =
    document
    .getElementById("financeChart");

  if (barCtx) {

    new Chart(barCtx, {

      type: "bar",

      data: {

        labels: [
          "Savings",
          "Loans",
          "Repayments",
          "Withdrawals"
        ],

        datasets: [{

          label: "Amount",

          data: [
            savings,
            loans,
            repayments,
            withdrawals
          ],

          backgroundColor: [

            "#0ea5e9",
            "#22c55e",
            "#f59e0b",
            "#ef4444"

          ],

          borderRadius: 10

        }]

      },

      options: {

        responsive: true,

        plugins: {

          legend: {
            display: false
          }

        }

      }

    });

  }

  /* PIE CHART */

  const pieCtx =
    document
    .getElementById("summaryChart");

  if (pieCtx) {

    new Chart(pieCtx, {

      type: "doughnut",

      data: {

        labels: [
          "Savings",
          "Loans",
          "Repayments",
          "Withdrawals"
        ],

        datasets: [{

          data: [
            savings,
            loans,
            repayments,
            withdrawals
          ],

          backgroundColor: [

            "#0ea5e9",
            "#22c55e",
            "#f59e0b",
            "#ef4444"

          ]

        }]

      },

      options: {

        responsive: true

      }

    });

  }

}

/* =========================================================
   RECENT ACTIVITIES
========================================================= */

async function loadRecentActivities() {

  const activityBox =
    document.getElementById(
      "recentActivities"
    );

  if (!activityBox) return;

  activityBox.innerHTML = "";

  try {

    const q =
      query(

        collection(db, "members"),

        orderBy(
          "createdAt",
          "desc"
        ),

        limit(5)

      );

    const snapshot =
      await getDocs(q);

    snapshot.forEach((doc) => {

      const data = doc.data();

      activityBox.innerHTML += `

        <div class="activity-item">

          <div>

            👤 New Member:
            <strong>
              ${data.name}
            </strong>

          </div>

          <small>

            ${
              data.createdAt
              ? new Date(
                  data.createdAt.seconds * 1000
                ).toLocaleDateString()
              : "-"
            }

          </small>

        </div>

      `;

    });

  }

  catch (error) {

    console.error(error);

  }

}

/* =========================================================
   START
========================================================= */

loadDashboard();
