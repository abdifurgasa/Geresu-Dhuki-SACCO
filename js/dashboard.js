import { db, auth } from "./firebase.js";

import {
  doc,
  getDoc,
  collection,
  onSnapshot,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* =========================
   STATE
========================= */

let role = null;
let chartsInitialized = false;

/* =========================
   GLOBAL STATS
========================= */

let stats = {
  members: 0,
  savings: 0,
  loans: 0,
  repayments: 0,
  withdrawals: 0,
  outstanding: 0
};

/* =========================
   AUTH
========================= */

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  role = snap.data().role;

  document.getElementById("roleBox").innerText =
    role === "admin" ? "👑 Admin" : "👤 Member";

  if (role === "admin") {
    loadAdminDashboard();
  } else {
    loadMemberDashboard(user.uid);

    document.querySelectorAll(".admin-only")
      .forEach(el => el.style.display = "none");
  }
});

/* =========================
   ADMIN DASHBOARD
========================= */

function loadAdminDashboard() {

  /* MEMBERS */
  onSnapshot(collection(db, "members"), snap => {
    stats.members = snap.size;
    document.getElementById("members").innerText = stats.members;
  });

  /* SAVINGS */
  onSnapshot(collection(db, "savings"), snap => {

    stats.savings = 0;

    snap.forEach(d => {
      stats.savings += Number(d.data().amount || 0);
    });

    document.getElementById("savings").innerText =
      stats.savings.toLocaleString() + " ETB";

    updateDashboard();
  });

  /* LOANS */
  onSnapshot(collection(db, "loans"), snap => {

    stats.loans = 0;
    stats.outstanding = 0;

    snap.forEach(d => {
      const l = d.data();
      stats.loans += Number(l.totalAmount || 0);
      stats.outstanding += Number(l.remaining || 0);
    });

    document.getElementById("loans").innerText =
      stats.loans.toLocaleString() + " ETB";

    updateDashboard();
  });

  /* REPAYMENTS */
  onSnapshot(collection(db, "repayments"), snap => {

    stats.repayments = 0;

    snap.forEach(d => {
      stats.repayments += Number(d.data().amount || 0);
    });

    updateDashboard();
  });

  /* 💸 WITHDRAWALS (NEW FIX) */
  onSnapshot(collection(db, "withdrawals"), snap => {

    stats.withdrawals = 0;

    snap.forEach(d => {
      stats.withdrawals += Number(d.data().amount || 0);
    });

    document.getElementById("withdrawals").innerText =
      stats.withdrawals.toLocaleString() + " ETB";

    updateDashboard();
  });
}

/* =========================
   MEMBER DASHBOARD
========================= */

function loadMemberDashboard(uid) {

  onSnapshot(
    query(collection(db, "savings"), where("memberId", "==", uid)),
    snap => {
      let total = 0;
      snap.forEach(d => total += Number(d.data().amount || 0));

      document.getElementById("savings").innerText =
        total.toLocaleString() + " ETB";
    }
  );
}

/* =========================
   PROFIT CALCULATION (FIXED)
========================= */

function calculateProfit() {

  return stats.savings
    - stats.loans
    - stats.withdrawals;
}

/* =========================
   UPDATE DASHBOARD
========================= */

function updateDashboard() {

  const profit = calculateProfit();

  document.getElementById("profit").innerText =
    profit.toLocaleString() + " ETB";

  updateCharts();
}

/* =========================
   CHARTS
========================= */

let financeChart;
let repaymentChart;

function updateCharts() {

  if (!chartsInitialized) {
    initCharts();
    chartsInitialized = true;
  }

  financeChart.data.datasets[0].data = [
    stats.savings,
    stats.loans,
    stats.repayments
  ];

  financeChart.update();

  repaymentChart.data.datasets[0].data = [
    stats.loans,
    stats.repayments,
    stats.outstanding
  ];

  repaymentChart.update();
}

/* =========================
   INIT CHARTS
========================= */

function initCharts() {

  financeChart = new Chart(
    document.getElementById("dashboardChart"),
    {
      type: "bar",
      data: {
        labels: ["Savings", "Loans", "Repayments"],
        datasets: [{ data: [0, 0, 0] }]
      }
    }
  );

  repaymentChart = new Chart(
    document.getElementById("repaymentChart"),
    {
      type: "doughnut",
      data: {
        labels: ["Loans", "Repayments", "Outstanding"],
        datasets: [{ data: [0, 0, 0] }]
      }
    }
  );
}

/* =========================
   LOGOUT
========================= */

window.logoutUser = async function () {
  await signOut(auth);
  localStorage.clear();
  window.location.href = "index.html";
};
