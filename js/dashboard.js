import { auth, db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* =========================
AUTH GATE (IMPORTANT FIX)
========================= */

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        console.warn("No authenticated user");
        return;
    }

    console.log("Dashboard loaded for:", user.uid);

    initializeSidebar();

    await loadDashboardData();

    createPerformanceChart();
    createLoanChart();

});

/* =========================
SIDEBAR
========================= */

function initializeSidebar() {

    const sidebar = document.getElementById("sidebar");
    const mainContent = document.getElementById("mainContent");
    const toggleBtn = document.getElementById("toggleBtn");

    if (!toggleBtn) return;

    toggleBtn.addEventListener("click", () => {

        sidebar.classList.toggle("collapsed");
        mainContent.classList.toggle("expanded");

    });
}

/* =========================
LOAD DASHBOARD DATA
========================= */

async function loadDashboardData() {

    try {

        const membersSnapshot =
            await getDocs(collection(db, "members"));

        const savingsSnapshot =
            await getDocs(collection(db, "savings"));

        const loansSnapshot =
            await getDocs(collection(db, "loans"));

        const repaymentsSnapshot =
            await getDocs(collection(db, "repayments"));

        const withdrawalsSnapshot =
            await getDocs(collection(db, "withdrawals"));

        const totalMembers = membersSnapshot.size;

        let totalSavings = 0;
        let totalLoans = 0;
        let totalRepayments = 0;
        let totalWithdrawals = 0;

        savingsSnapshot.forEach(doc => {
            totalSavings += Number(doc.data().amount || 0);
        });

        loansSnapshot.forEach(doc => {
            totalLoans += Number(doc.data().amount || 0);
        });

        repaymentsSnapshot.forEach(doc => {
            totalRepayments += Number(doc.data().amount || 0);
        });

        withdrawalsSnapshot.forEach(doc => {
            totalWithdrawals += Number(doc.data().amount || 0);
        });

        const netProfit =
            totalRepayments - totalWithdrawals;

        updateDashboardCards({
            totalMembers,
            totalSavings,
            totalLoans,
            totalWithdrawals,
            netProfit
        });

    } catch (error) {
        console.error("Dashboard Error:", error);
    }
}

/* =========================
UPDATE CARDS
========================= */

function updateDashboardCards(data) {

    const memberCard = document.getElementById("totalMembers");
    const savingsCard = document.getElementById("totalSavings");
    const loansCard = document.getElementById("totalLoans");
    const withdrawalsCard = document.getElementById("totalWithdrawals");
    const profitCard = document.getElementById("netProfit");

    if (memberCard)
        memberCard.textContent = data.totalMembers;

    if (savingsCard)
        savingsCard.textContent = formatCurrency(data.totalSavings);

    if (loansCard)
        loansCard.textContent = formatCurrency(data.totalLoans);

    if (withdrawalsCard)
        withdrawalsCard.textContent = formatCurrency(data.totalWithdrawals);

    if (profitCard)
        profitCard.textContent = formatCurrency(data.netProfit);
}

/* =========================
FORMAT CURRENCY
========================= */

function formatCurrency(amount) {
    return Number(amount).toLocaleString() + " ETB";
}

/* =========================
PERFORMANCE CHART
========================= */

function createPerformanceChart() {

    const chart = document.getElementById("performanceChart");

    if (!chart) return;

    new Chart(chart, {

        type: "line",

        data: {

            labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],

            datasets: [
                {
                    label: "Savings",
                    data: [100,120,140,150,170,190,200,220,240,260,280,300],
                    tension: 0.4
                },
                {
                    label: "Loans",
                    data: [50,70,80,90,100,110,130,140,150,160,170,180],
                    tension: 0.4
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

/* =========================
LOAN CHART
========================= */

function createLoanChart() {

    const chart = document.getElementById("loanChart");

    if (!chart) return;

    new Chart(chart, {

        type: "bar",

        data: {

            labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],

            datasets: [
                {
                    label: "Loans",
                    data: [100,120,150,160,180,210,230,200,170,180,170,150]
                },
                {
                    label: "Repayments",
                    data: [60,60,85,90,100,130,145,110,120,75,95,80]
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}
