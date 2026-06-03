import { db, auth } from "./firebase.js";

import {
collection,
addDoc,
updateDoc,
deleteDoc,
doc,
getDoc,
onSnapshot,
serverTimestamp
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================
COLLECTION
========================= */

const loansCollection = collection(db, "loans");

/* =========================
STATE
========================= */

let loans = [];
let filteredLoans = [];

let currentPage = 1;
const rowsPerPage = 10;

let editingId = null;

/* =========================
GLOBAL FUNCTIONS (IMPORTANT)
========================= */

window.openAddModal = openAddModal;
window.closeModal = closeModal;
window.saveLoan = saveLoan;
window.editLoan = editLoan;
window.deleteLoanConfirm = deleteLoanConfirm;
window.searchLoans = searchLoans;
window.nextPage = nextPage;
window.prevPage = prevPage;
window.openProfile = openProfile;

/* =========================
REALTIME LOADING
========================= */

onSnapshot(loansCollection, (snapshot) => {

    loans = [];

    snapshot.forEach((docSnap) => {

        loans.push({
            id: docSnap.id,
            ...docSnap.data()
        });

    });

    filteredLoans = [...loans];

    updateLoansCount();
    renderTable();

});

/* =========================
TOTAL COUNT
========================= */

function updateLoansCount() {

    const el = document.getElementById("totalLoans");

    if (el) {
        el.textContent = loans.length;
    }
}

/* =========================
OPEN ADD MODAL
========================= */

function openAddModal() {

    editingId = null;

    document.getElementById("loanId").value = "";
    document.getElementById("memberName").value = "";
    document.getElementById("phone").value = "";
    document.getElementById("principal").value = "";
    document.getElementById("interestRate").value = "";
    document.getElementById("duration").value = "";
    document.getElementById("loanType").value = "Business";
    document.getElementById("status").value = "Active";

    document.getElementById("modalTitle").textContent = "Add Loan";

    document.getElementById("loanModal").style.display = "flex";
}

/* =========================
CLOSE MODAL
========================= */

function closeModal() {

    document.getElementById("loanModal").style.display = "none";
}

/* =========================
SAVE LOAN (CREATE / UPDATE)
========================= */

async function saveLoan() {

    try {

        const user = auth.currentUser;

        if (!user) {
            alert("Session expired. Please login again.");
            return;
        }

        const memberName = document.getElementById("memberName").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const principal = Number(document.getElementById("principal").value);
        const interestRate = Number(document.getElementById("interestRate").value);
        const duration = Number(document.getElementById("duration").value);
        const loanType = document.getElementById("loanType").value;
        const status = document.getElementById("status").value;

        /* =========================
        VALIDATION
        ========================= */

        if (!memberName) return alert("Member name required");
        if (!phone) return alert("Phone required");
        if (principal <= 0) return alert("Invalid principal");
        if (interestRate < 0) return alert("Invalid interest rate");

        /* =========================
        CALCULATIONS
        ========================= */

        const interestAmount = principal * (interestRate / 100);
        const totalAmount = principal + interestAmount;

        const loanData = {

            memberName,
            phone,

            principal,
            interestRate,
            interestAmount,

            totalAmount,
            remainingBalance: totalAmount,

            loanType,
            duration,
            status,

            createdBy: user.email || "System",
            updatedAt: serverTimestamp()

        };

        /* =========================
        CREATE OR UPDATE
        ========================= */

        if (!editingId) {

            loanData.createdAt = serverTimestamp();

            await addDoc(loansCollection, loanData);

        } else {

            await updateDoc(doc(db, "loans", editingId), loanData);
        }

        closeModal();

    } catch (error) {

        console.error(error);
        alert(error.message);
    }
}

/* =========================
EDIT LOAN
========================= */

async function editLoan(id) {

    try {

        const snap = await getDoc(doc(db, "loans", id));

        if (!snap.exists()) return;

        const l = snap.data();

        editingId = id;

        document.getElementById("loanId").value = id;
        document.getElementById("memberName").value = l.memberName || "";
        document.getElementById("phone").value = l.phone || "";
        document.getElementById("principal").value = l.principal || 0;
        document.getElementById("interestRate").value = l.interestRate || 0;
        document.getElementById("duration").value = l.duration || 0;
        document.getElementById("loanType").value = l.loanType || "Business";
        document.getElementById("status").value = l.status || "Active";

        document.getElementById("modalTitle").textContent = "Edit Loan";

        document.getElementById("loanModal").style.display = "flex";

    } catch (error) {

        console.error(error);
        alert(error.message);
    }
}

/* =========================
DELETE LOAN
========================= */

async function deleteLoanConfirm(id) {

    if (!confirm("Delete this loan?")) return;

    try {

        await deleteDoc(doc(db, "loans", id));

    } catch (error) {

        console.error(error);
        alert(error.message);
    }
}

/* =========================
SEARCH LOANS
========================= */

function searchLoans() {

    const keyword = document.getElementById("searchInput").value.toLowerCase();

    filteredLoans = loans.filter(l =>
        (l.memberName || "").toLowerCase().includes(keyword) ||
        (l.phone || "").includes(keyword) ||
        (l.loanType || "").toLowerCase().includes(keyword)
    );

    currentPage = 1;

    renderTable();
}

/* =========================
RENDER TABLE
========================= */

function renderTable() {

    const tbody = document.getElementById("loansTable");
    if (!tbody) return;

    tbody.innerHTML = "";

    const start = (currentPage - 1) * rowsPerPage;
    const pageData = filteredLoans.slice(start, start + rowsPerPage);

    pageData.forEach(l => {

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${l.memberName || ""}</td>
            <td>${l.phone || ""}</td>
            <td>${l.principal || 0}</td>
            <td>${l.interestAmount || 0}</td>
            <td>${l.totalAmount || 0}</td>
            <td>${l.remainingBalance || 0}</td>
            <td>${l.loanType || ""}</td>
            <td>${l.duration || ""}</td>
            <td>${l.status || ""}</td>
            <td>${formatDate(l.createdAt)}</td>
            <td>${l.createdBy || "-"}</td>

            <td>
                <button onclick="openProfile('${l.id}')">View</button>
                <button onclick="editLoan('${l.id}')">Edit</button>
                <button onclick="deleteLoanConfirm('${l.id}')">Delete</button>
            </td>
        `;

        tbody.appendChild(tr);
    });

    updatePageInfo();
}

/* =========================
PAGE INFO
========================= */

function updatePageInfo() {

    const el = document.getElementById("pageInfo");

    if (!el) return;

    const totalPages = Math.ceil(filteredLoans.length / rowsPerPage) || 1;

    el.textContent = `Page ${currentPage} of ${totalPages}`;
}

/* =========================
PAGINATION
========================= */

function nextPage() {

    const totalPages = Math.ceil(filteredLoans.length / rowsPerPage);

    if (currentPage < totalPages) {
        currentPage++;
        renderTable();
    }
}

function prevPage() {

    if (currentPage > 1) {
        currentPage--;
        renderTable();
    }
}

/* =========================
PROFILE VIEW
========================= */

async function openProfile(id) {

    const snap = await getDoc(doc(db, "loans", id));

    if (!snap.exists()) return;

    const l = snap.data();

    document.getElementById("profileContent").innerHTML = `
        <div style="padding:10px">

            <h2>${l.memberName}</h2>

            <p><b>Phone:</b> ${l.phone}</p>
            <p><b>Principal:</b> ${l.principal}</p>
            <p><b>Interest:</b> ${l.interestAmount}</p>
            <p><b>Total:</b> ${l.totalAmount}</p>
            <p><b>Remaining:</b> ${l.remainingBalance}</p>
            <p><b>Status:</b> ${l.status}</p>
            <p><b>Type:</b> ${l.loanType}</p>
            <p><b>Duration:</b> ${l.duration}</p>
            <p><b>Created By:</b> ${l.createdBy}</p>
        </div>
    `;

    document.getElementById("profileModal").style.display = "flex";
}

/* =========================
DATE FORMAT
========================= */

function formatDate(timestamp) {

    if (!timestamp) return "-";

    if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleString();
    }

    return "-";
}
