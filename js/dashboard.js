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
   LIVE DOM ELEMENTS
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

let chartInstance = null;

/* =========================================================
   ANIMATION COUNTER
========================================================= */

function animateValue(
  el,
  start,
  end,
  duration = 800
) {

  if (!el) return;

  let startTimestamp = null;

  const step = (timestamp) => {

    if (!startTimestamp)
      startTimestamp = timestamp;

    const progress = Math.min(
      (timestamp - startTimestamp) / duration,
      1
    );

    const value = Math.floor(
      progress * (end - start) + start
    );

    el.innerText =
      value.toLocaleString() + " ETB";

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

  onSnapshot(
    collection(db, "members"),
    (snap) => {

      const count = snap.size;

      if (membersEl) {

        membersEl.innerText =
          count.toLocaleString();

      }

    }
  );

  /* ---------------- SAVINGS ---------------- */

  onSnapshot(
    collection(db, "savings"),
    (snap) => {

      let total = 0;

      snap.forEach((doc) => {

        total += Number(
          doc.data().amount || 0
        );

      });

      animateValue(
        savingsEl,
        0,
        total
      );

      updateChart();

    }
  );

  /* ---------------- LOANS ---------------- */

  onSnapshot(
    collection(db, "loans"),
    (snap) => {

      let total = 0;

      snap.forEach((doc) => {

        total += Number(
          doc.data().amount || 0
        );

      });

      animateValue(
        loansEl,
        0,
        total
      );

      updateChart();

    }
  );

  /* ---------------- WITHDRAWALS ---------------- */

  onSnapshot(
    collection(db, "withdrawals"),
    (snap) => {

      let total = 0;

      snap.forEach((doc) => {

        total += Number(
          doc.data().amount || 0
        );

      });

      animateValue(
        withdrawalsEl,
        0,
        total
      );

      updateChart();

    }
  );

}

/* =========================================================
   CHART (LOANS VS REPAYMENTS)
========================================================= */

async function updateChart() {

  const loansSnap =
    await getDocs(
      collection(db, "loans")
    );

  const repaySnap =
    await getDocs(
      collection(db, "repayments")
    );

  let loansTotal = 0;

  let repayTotal = 0;

  loansSnap.forEach((d) => {

    loansTotal += Number(
      d.data().amount || 0
    );

  });

  repaySnap.forEach((d) => {

    repayTotal += Number(
      d.data().amount || 0
    );

  });

  const ctx =
    document.getElementById(
      "financeChart"
    );

  if (!ctx) return;

  if (chartInstance) {

    chartInstance.destroy();

  }

  chartInstance = new Chart(ctx, {

    type: "bar",

    data: {

      labels: [
        "Loans",
        "Repayments"
      ],

      datasets: [{

        label: "ETB",

        data: [
          loansTotal,
          repayTotal
        ],

        backgroundColor: [
          "#f97316",
          "#22c55e"
        ]

      }]

    },

    options: {

      responsive: true,

      plugins: {

        legend: {
          display: false
        }

      },

      animation: {

        duration: 1200

      }

    }

  });

  /* ---------------- PROFIT ---------------- */

  const profit =
    repayTotal - loansTotal;

  animateValue(
    profitEl,
    0,
    profit
  );

}
// ================= SIDEBAR TOGGLE =================
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("collapsed");
}

// ================= DARK MODE =================
function toggleTheme() {
  document.body.classList.toggle("light");
}

// ================= ACTIVE INDICATOR =================
const items = document.querySelectorAll(".nav-item");
const indicator = document.getElementById("indicator");

function setActive(el) {
  items.forEach(i => i.classList.remove("active"));
  el.classList.add("active");

  indicator.style.top = el.offsetTop + "px";
  indicator.style.height = el.offsetHeight + "px";
}

// init indicator
setActive(items[0]);

// ================= NOTIFICATIONS =================
let count = 3;

// ================= REAL TIME UPDATES =================
setInterval(() => {

  document.getElementById("members").innerText =
    Math.floor(Math.random() * 200);

  document.getElementById("savings").innerText =
    Math.floor(Math.random() * 10000);

  document.getElementById("loans").innerText =
    Math.floor(Math.random() * 5000);

}, 3000);

// ================= CHART =================
const ctx = document.getElementById("chart");

new Chart(ctx, {
  type: "line",
  data: {
    labels: ["Jan","Feb","Mar","Apr","May","Jun"],
    datasets: [{
      label: "Performance",
      data: [10,20,15,40,30,60],
      borderColor: "#4facfe",
      tension: 0.4
    }]
  }
});
/* =========================================================
   USER INFO
========================================================= */

onAuthStateChanged(
  auth,
  (user) => {

    if (!user) return;

    const name =
      localStorage.getItem("name") ||
      user.displayName ||
      "Admin";

    const roleBox =
      document.getElementById(
        "roleBox"
      );

    if (roleBox) {

      roleBox.innerText =
        `👤 ${name}`;

    }

  }
);

/* =========================================================
   LOGOUT
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const logoutBtn =
      document.getElementById(
        "logoutBtn"
      );

    if (logoutBtn) {

      logoutBtn.addEventListener(
        "click",
        async (e) => {

          e.preventDefault();

          await signOut(auth);

          localStorage.clear();

          window.location.href =
            "login.html";

        }
      );

    }

  }
);

/* =========================================================
   INIT
========================================================= */

loadDashboard();

updateChart();
