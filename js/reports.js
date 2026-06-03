import { db } from "./firebase.js";

import {
collection,
onSnapshot,
query,
orderBy,
limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* COLLECTIONS */
const membersCol = collection(db, "members");
const savingsCol = collection(db, "savings");
const loansCol = collection(db, "loans");
const withdrawalsCol = collection(db, "withdrawals");

/* LOAD ALL REPORT DATA */
onSnapshot(membersCol, snap => {
    document.getElementById("totalMembers").textContent = snap.size;

    const tbody = document.getElementById("membersTable");
    tbody.innerHTML = "";

    snap.forEach(d => {
        const m = d.data();
        tbody.innerHTML += `
            <tr>
                <td>${m.fullName || ""}</td>
                <td>${m.phone || ""}</td>
                <td>${formatDate(m.createdAt)}</td>
            </tr>
        `;
    });
});

/* SAVINGS */
onSnapshot(savingsCol, snap => {

    let total = 0;

    const tbody = document.getElementById("savingsTable");
    tbody.innerHTML = "";

    snap.forEach(d => {
        const s = d.data();
        total += Number(s.amount || 0);

        tbody.innerHTML += `
            <tr>
                <td>${s.name || ""}</td>
                <td>${s.amount || 0}</td>
                <td>${formatDate(s.createdAt)}</td>
            </tr>
        `;
    });

    document.getElementById("totalSavings").textContent = total;
});

/* LOANS */
onSnapshot(loansCol, snap => {

    let total = 0;

    const tbody = document.getElementById("loansTable");
    tbody.innerHTML = "";

    snap.forEach(d => {
        const l = d.data();
        total += Number(l.principal || 0);

        tbody.innerHTML += `
            <tr>
                <td>${l.name || ""}</td>
                <td>${l.principal || 0}</td>
                <td>${l.status || ""}</td>
            </tr>
        `;
    });

    document.getElementById("totalLoans").textContent = total;
});

/* WITHDRAWALS */
onSnapshot(withdrawalsCol, snap => {

    let total = 0;

    const tbody = document.getElementById("withdrawalsTable");
    tbody.innerHTML = "";

    snap.forEach(d => {
        const w = d.data();
        total += Number(w.amount || 0);

        tbody.innerHTML += `
            <tr>
                <td>${w.name || ""}</td>
                <td>${w.amount || 0}</td>
                <td>${w.reason || ""}</td>
            </tr>
        `;
    });

    document.getElementById("totalWithdrawals").textContent = total;
});

/* DATE FORMAT */
function formatDate(ts) {
    if (!ts) return "-";
    if (ts.seconds) {
        return new Date(ts.seconds * 1000).toLocaleDateString();
    }
    return "-";
}
