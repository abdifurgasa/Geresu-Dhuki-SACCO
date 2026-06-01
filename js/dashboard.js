import { db } from "./firebase.js";
import { collection, onSnapshot } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ================= SIDEBAR ================= */
window.toggleSidebar = function () {
  document.querySelector(".sidebar").classList.toggle("active");
};

/* ================= LOGOUT ================= */
window.logout = function () {
  window.location.href = "index.html";
};

/* ================= REALTIME DATA ================= */

onSnapshot(collection(db, "members"), (snap) => {
  document.getElementById("members").innerText = snap.size;
});

onSnapshot(collection(db, "savings"), (snap) => {
  let total = 0;
  snap.forEach(d => total += d.data().amount || 0);
  document.getElementById("savings").innerText = total;
});

onSnapshot(collection(db, "loans"), (snap) => {
  let total = 0;
  snap.forEach(d => total += d.data().amount || 0);
  document.getElementById("loans").innerText = total;
});

/* ================= CHART ================= */
const ctx = document.getElementById("chart");

new Chart(ctx, {
  type: "line",
  data: {
    labels: ["Jan","Feb","Mar","Apr","May"],
    datasets: [{
      label: "SACCO Growth",
      data: [10,20,40,30,60],
      borderColor: "#4facfe",
      tension: 0.4
    }]
  }
});
