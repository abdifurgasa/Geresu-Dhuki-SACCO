import { db, auth } from "./firebase.js";

import {
  collection,
  onSnapshot,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* =========================================================
   DOM ELEMENTS
========================================================= */

const membersEl = document.getElementById("members");
const savingsEl = document.getElementById("savings");
const loansEl = document.getElementById("loans");
const withdrawalsEl = document.getElementById("withdrawals");
const profitEl = document.getElementById("profit");

let chartInstance = null;

/* =========================================================
   SAFE NUMBER ANIMATION
========================================================= */

function animateValue(el, start, end, duration = 800) {
  if (!el) return;

  let startTimestamp = null;

  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;

    const progress = Math.min((timestamp - startTimestamp) / duration, 1);

    const value = Math.floor(progress * (end - start) + start);

    el.innerText = value.toLocaleString();

    if (progress < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}

/* =========================================================
   LOAD DASHBOARD DATA
========================================================= */

function loadDashboard() {

  // MEMBERS
  onSnapshot(collection(db, "members"), (snap) => {
    if (membersEl) membersEl.innerText = snap.size.toLocaleString();
  });

  // SAVINGS
  onSnapshot(collection(db, "savings"), (snap) => {
    let total = 0;
    snap.forEach(d => total += Number(d.data().amount || 0));

    animateValue(savingsEl, 0, total);
  });

  // LOANS
  onSnapshot(collection(db, "loans"), (snap) => {
    let total = 0;
    snap.forEach(d => total += Number(d.data().amount || 0));

    animateValue(loansEl, 0, total);
  });

  // WITHDRAWALS
  onSnapshot(collection(db, "withdrawals"), (snap) => {
    let total = 0;
    snap.forEach(d => total += Number(d.data().amount || 0));

    animateValue(withdrawalsEl, 0, total);
  });
}

/* =========================================================
   CHART UPDATE
========================================================= */

async function updateChart() {

  const loansSnap = await getDocs(collection(db, "loans"));
  const repaySnap = await getDocs(collection(db, "repayments"));

  let loansTotal = 0;
  let repayTotal = 0;

  loansSnap.forEach(d => loansTotal += Number(d.data().amount || 0));
  repaySnap.forEach(d => repayTotal += Number(d.data().amount || 0));

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
      plugins: { legend: { display: false } }
    }
  });

  const profit = repayTotal - loansTotal;
  animateValue(profitEl, 0, profit);
}

/* =========================================================
   AUTH PROTECTION (🔥 FIX FOR LOGOUT BUG)
========================================================= */

onAuthStateChanged(auth, (user) => {

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  console.log("LOGIN OK:", user.email);

  // ✅ ONLY RUN AFTER LOGIN CONFIRMED
  loadDashboard();
  updateChart();

  const roleBox = document.getElementById("roleBox");

  if (roleBox) {
    roleBox.innerText = "👤 " + (user.email || "User");
  }

});

/* =========================================================
   LOGOUT
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      await signOut(auth);

      localStorage.clear();

      window.location.href = "index.html";
    });
  }

});
