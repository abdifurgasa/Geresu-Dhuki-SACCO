import { db, auth } from "./firebase.js";

import {
collection,
addDoc,
doc,
getDoc,
getDocs,
updateDoc,
query,
where,
onSnapshot,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================
COLLECTIONS
========================= */

const repaymentsCollection = collection(db, "repayments");
const loansCollection = collection(db, "loans");

/* =========================
STATE
========================= */

let repayments = [];
let filteredRepayments = [];

let currentPage = 1;
const rowsPerPage = 10;

let editingId = null;

/* =========================
GLOBAL FUNCTIONS (IMPORTANT)
========================= */

window.openAddModal = openAddModal;
window.closeModal = closeModal;
window.saveRepayment = saveRepayment;
window.searchRepayments = searchRepayments;
window.nextPage = nextPage;
window.prevPage = prevPage;
window.openProfile = openProfile;

/* =========================
REALTIME LOAD
========================= */

onSnapshot(repaymentsCollection, (snapshot) => {

    repayments = [];

    snapshot.forEach((docSnap) => {
        repayments.push({
            id: docSnap.id,
            ...docSnap.data()
        });
    });

    filteredRepayments = [...repayments];

    updateCount();
    renderTable();

});

/* =========================
AUTH SAFE
========================= */

function getUser() {
    return auth.currentUser;
}

/* =========================
OPEN MODAL
========================= */

function openAddModal() {

    document.getElementById("loanId").value = "";
    document.getElementById("amount").value = "";

    document.getElementById("repaymentModal").style.display = "flex";
}

/* =========================
CLOSE MODAL
========================= */

function closeModal() {
    document.getElementById("repaymentModal").style.display = "none";
}

/* =========================
SAVE REPAYMENT (CORE LOGIC)
========================= */

async function saveRepayment() {

    try {

        const user = getUser();

        if (!user) {
            alert("Session expired. Please login again.");
            return;
        }

        const loanId = document.getElementById("loanId").value.trim();
        const amount = Number(document.getElementById("amount").value);

        if (!loanId) return alert("Loan ID required");
        if (!amount || amount <= 0) return alert("Invalid amount");

        /* =========================
        GET LOAN
        ========================= */

        const loanRef = doc(db, "loans", loanId);
        const loanSnap = await getDoc(loanRef);

        if (!loanSnap.exists()) {
            alert("Loan not found");
            return;
        }

        const loan = loanSnap.data();

        const remaining = Number(loan.remaining || 0);

        /* =========================
        CHECK OVERPAYMENT
        ========================= */

        if (amount > remaining) {
            alert("Amount exceeds remaining loan");
            return;
        }

        const newRemaining = remaining - amount;

        /* =========================
        UPDATE LOAN BALANCE
        ========================= */

        await updateDoc(loanRef, {
            remaining: newRemaining,
            status: newRemaining === 0 ? "PAID" : "ACTIVE",
            updatedAt: serverTimestamp()
        });

        /* =========================
        SAVE REPAYMENT
        ========================= */

        await addDoc(repaymentsCollection, {
            loanId,
            memberId: loan.memberId || "",
            amount,
            remainingLoan: newRemaining,
            createdBy: user.email || "System",
            createdAt: serverTimestamp()
        });

        closeModal();

    } catch (err) {
        console.error(err);
        alert(err.message);
    }
}

/* =========================
SEARCH
========================= */

function searchRepayments() {

    const keyword = document.getElementById("searchInput").value.toLowerCase();

    filteredRepayments = repayments.filter(r =>
        (r.loanId || "").toLowerCase().includes(keyword) ||
        (r.createdBy || "").toLowerCase().includes(keyword)
    );

    renderTable();
}

/* =========================
TABLE RENDER
========================= */

function renderTable() {

    const tbody = document.getElementById("repaymentsTable");

    if (!tbody) return;

    tbody.innerHTML = "";

    const start = (currentPage - 1) * rowsPerPage;

    const pageData = filteredRepayments.slice(start, start + rowsPerPage);

    pageData.forEach(r => {

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${r.memberId || "-"}</td>
            <td>${r.loanId || "-"}</td>
            <td>${r.amount || 0}</td>
            <td>${r.remainingLoan || 0}</td>
            <td>${r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000).toLocaleDateString() : "-"}</td>
            <td>${r.createdBy || "-"}</td>
            <td>
                <button onclick="openProfile('${r.id}')">View</button>
            </td>
        `;

        tbody.appendChild(tr);

    });

    updatePage();
}

/* =========================
PROFILE
========================= */

async function openProfile(id) {

    const snap = await getDoc(doc(db, "repayments", id));

    if (!snap.exists()) return;

    const r = snap.data();

    document.getElementById("profileContent").innerHTML = `
        <h2>Repayment Details</h2>
        <p><b>Loan:</b> ${r.loanId}</p>
        <p><b>Amount:</b> ${r.amount}</p>
        <p><b>Remaining:</b> ${r.remainingLoan}</p>
        <p><b>Created By:</b> ${r.createdBy}</p>
    `;

    document.getElementById("profileModal").style.display = "flex";
}

/* =========================
PAGINATION
========================= */

function nextPage() {
    currentPage++;
    renderTable();
}

function prevPage() {
    if (currentPage > 1) currentPage--;
    renderTable();
}

function updatePage() {

    const totalPages = Math.ceil(filteredRepayments.length / rowsPerPage) || 1;

    const el = document.getElementById("pageInfo");

    if (el) el.textContent = `Page ${currentPage} of ${totalPages}`;
}

/* =========================
COUNT
========================= */

function updateCount() {

    const el = document.getElementById("totalRepayments");

    if (el) el.textContent = repayments.length;
}
