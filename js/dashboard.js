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
   LIVE DASHBOARD
========================= */

function loadDashboard() {

  /* MEMBERS */
  onSnapshot(collection(db, "members"), (snap) => {
    membersEl.textContent = snap.size;
  });

  /* SAVINGS */
  onSnapshot(collection(db, "savings"), (snap) => {

    let total = 0;

    snap.forEach(doc => {
      total += Number(doc.data().amount || 0);
    });

    savingsEl.textContent = total + " ETB";
  });

  /* LOANS */
  onSnapshot(collection(db, "loans"), (snap) => {

    let total = 0;

    snap.forEach(doc => {
      total += Number(doc.data().amount || 0);
    });

    loansEl.textContent = total + " ETB";
  });

  /* WITHDRAWALS */
  onSnapshot(collection(db, "withdrawals"), (snap) => {

    let total = 0;

    snap.forEach(doc => {
      total += Number(doc.data().amount || 0);
    });

    withdrawalsEl.textContent = total + " ETB";
  });

}

/* =========================
   PROFIT CALCULATION
========================= */

function loadProfit() {

  onSnapshot(collection(db, "savings"), (savSnap) => {
    onSnapshot(collection(db, "withdrawals"), (withSnap) => {

      let savings = 0;
      let withdrawals = 0;

      savSnap.forEach(d => savings += Number(d.data().amount || 0));
      withSnap.forEach(d => withdrawals += Number(d.data().amount || 0));

      const profit = savings - withdrawals;

      profitEl.textContent = profit + " ETB";

    });
  });

}

/* RUN */
loadDashboard();
loadProfit();
