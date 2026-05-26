import { db, auth } from "./firebase.js";
import {
  collection,
  onSnapshot,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* =========================================================
   LIVE DOM ELEMENTS
========================================================= */

const membersEl = document.getElementById("members");
const savingsEl = document.getElementById("savings");
const loansEl = document.getElementById("loans");
const withdrawalsEl = document.getElementById("withdrawals");
const profitEl = document.getElementById("profit");

let chartInstance = null;

/* =========================================================
   ANIMATION COUNTER
========================================================= */

function animateValue(el, start, end, duration = 800) {
  if (!el) return;

  let startTimestamp = null;

  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;

    const progress = Math.min(
      (timestamp - startTimestamp) / duration,
      1
    );

    const value = Math.floor(progress * (end - start) + start);

    el.innerText = value.toLocaleString();

    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };

  window.requestAnimationFrame(step);
}

/* =========================================================
   LOAD DASHBOARD DATA (REALTIME)
========================================================= */

function loadDashboard() {

  /* ---------------- MEMBERS ---------------- */
  onSnapshot(collection(db, "members"), (snap) => {
    const count = snap.size;
    animateValue(membersEl, 0, count);
  });

  /* ---------------- SAVINGS ---------------- */
  onSnapshot(collection(db, "savings"), (snap) => {
    let total = 0;

    snap.forEach(doc => {
      total += Number(doc.data().amount || 0 ETB);
    });

    animateValue(savingsEl, 0, total);
    updateChart();
  });

  /* ---------------- LOANS ---------------- */
  onSnapshot(collection(db, "loans"), (snap) => {
    let total = 0;

    snap.forEach(doc => {
      total += Number(doc.data().amount || 0 ETB);
    });

    animateValue(loansEl, 0, total);
    updateChart();
  });

  /* ---------------- WITHDRAWALS ---------------- */
  onSnapshot(collection(db, "withdrawals"), (snap) => {
    let total = 0;

    snap.forEach(doc => {
      total += Number(doc.data().amount || 0 ETB);
    });

    animateValue(withdrawalsEl, 0, total);
    updateChart();
  });
}

/* =========================================================
   CHART (LOANS VS REPAYMENTS)
========================================================= */

async function updateChart() {

  const loansSnap = await getDocs(collection(db, "loans"));
  const repaySnap = await getDocs(collection(db, "repayments"));

  let loansTotal = 0;
  let repayTotal = 0;

  loansSnap.forEach(d => {
    loansTotal += Number(d.data().amount || 0);
  });

  repaySnap.forEach(d => {
    repayTotal += Number(d.data().amount || 0);
  });

  const ctx = document.getElementById("financeChart");

  if (!ctx) return;

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Loans", "Repayments"],
      datasets: [{
        label: "ETB",
        data: [loansTotal, repayTotal],
        backgroundColor: ["#f97316", "#22c55e"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      animation: {
        duration: 1200
      }
    }
  });

  /* ---------------- PROFIT ---------------- */
  const profit = repayTotal - loansTotal;
  animateValue(profitEl, 0, profit);
}

/* =========================================================
   USER INFO (CREATED BY NAME FIX)
========================================================= */

onAuthStateChanged(auth, (user) => {
  if (!user) return;

  // IMPORTANT FIX: use displayName NOT email
  const name = user.displayName || "Admin";

  const roleBox = document.getElementById("roleBox");
  if (roleBox) {
    roleBox.innerText = `👤 ${name}`;
  }
});

/* =========================================================
   LOGOUT + MENU ACTIONS
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      await signOut(auth);
      window.location.href = "login.html";
    });
  }

});

/* =========================================================
   INIT
========================================================= */

loadDashboard();
updateChart();
