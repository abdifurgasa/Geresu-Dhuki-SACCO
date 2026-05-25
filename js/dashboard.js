import { db } from "./firebase.js";

import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================
   ELEMENTS
========================= */

const membersEl = document.getElementById("members");
const savingsEl = document.getElementById("savings");
const loansEl = document.getElementById("loans");
const withdrawalsEl = document.getElementById("withdrawals");
const profitEl = document.getElementById("profit");

/* =========================
   TOTALS
========================= */

let totalMembers = 0;
let totalSavings = 0;
let totalLoans = 0;
let totalRepayments = 0;
let totalWithdrawals = 0;

/* =========================
   UPDATE DASHBOARD
========================= */

function updateUI() {

  const netProfit =
    totalSavings +
    totalRepayments -
    totalLoans -
    totalWithdrawals;

  membersEl.textContent = totalMembers;
  savingsEl.textContent = totalSavings + " ETB";
  loansEl.textContent = totalLoans + " ETB";
  withdrawalsEl.textContent = totalWithdrawals + " ETB";
  profitEl.textContent = netProfit + " ETB";

  updateChart();
}

/* =========================
   MEMBERS
========================= */

onSnapshot(collection(db, "members"), (snap) => {
  totalMembers = snap.size;
  updateUI();
});

/* =========================
   SAVINGS
========================= */

onSnapshot(collection(db, "savings"), (snap) => {

  totalSavings = 0;

  snap.forEach(doc => {
    totalSavings += Number(doc.data().amount || 0);
  });

  updateUI();
});

/* =========================
   LOANS
========================= */

onSnapshot(collection(db, "loans"), (snap) => {

  totalLoans = 0;

  snap.forEach(doc => {
    totalLoans += Number(doc.data().amount || 0);
  });

  updateUI();
});

/* =========================
   REPAYMENTS
========================= */

onSnapshot(collection(db, "repayments"), (snap) => {

  totalRepayments = 0;

  snap.forEach(doc => {
    totalRepayments += Number(doc.data().amount || 0);
  });

  updateUI();
});

/* =========================
   WITHDRAWALS
========================= */

onSnapshot(collection(db, "withdrawals"), (snap) => {

  totalWithdrawals = 0;

  snap.forEach(doc => {
    totalWithdrawals += Number(doc.data().amount || 0);
  });

  updateUI();
});

/* =========================
   CHART (LOANS vs REPAYMENTS)
========================= */

let chart;

function updateChart() {

  const ctx = document.getElementById("financeChart");

  if (!ctx) return;

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Loans", "Repayments"],
      datasets: [
        {
          label: "Amount (ETB)",
          data: [totalLoans, totalRepayments],
          backgroundColor: ["#f97316", "#22c55e"]
        }
      ]
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

/* =========================
   INITIAL LOAD
========================= */

updateUI();
