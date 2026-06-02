// ===============================
// SIDEBAR TOGGLE
// ===============================

document.addEventListener("DOMContentLoaded", () => {

    const sidebar = document.getElementById("sidebar");
    const mainContent = document.getElementById("mainContent");
    const toggleBtn = document.getElementById("toggleBtn");

    if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {

            sidebar.classList.toggle("collapsed");
            mainContent.classList.toggle("expanded");

        });
    }

    initializeCharts();

});

// ===============================
// CHARTS
// ===============================

function initializeCharts() {

    // Performance Chart
    const performanceCanvas =
        document.getElementById("performanceChart");

    if (performanceCanvas) {

        new Chart(performanceCanvas, {

            type: "line",

            data: {

                labels: [
                    "Jan", "Feb", "Mar", "Apr",
                    "May", "Jun", "Jul", "Aug",
                    "Sep", "Oct", "Nov", "Dec"
                ],

                datasets: [

                    {
                        label: "Savings (ETB)",
                        data: [
                            95000, 115000, 130000,
                            140000, 150000, 165000,
                            165000, 180000, 190000,
                            202000, 210000, 225000
                        ],
                        tension: 0.4,
                        fill: true
                    },

                    {
                        label: "Loans (ETB)",
                        data: [
                            55000, 70000, 78000,
                            83000, 88000, 96000,
                            95000, 104000, 107000,
                            112000, 115000, 122000
                        ],
                        tension: 0.4,
                        fill: true
                    },

                    {
                        label: "Withdrawals (ETB)",
                        data: [
                            25000, 34000, 39000,
                            37000, 40000, 47000,
                            47000, 50000, 54000,
                            55000, 57000, 62000
                        ],
                        tension: 0.4,
                        fill: true
                    },

                    {
                        label: "Profit (ETB)",
                        data: [
                            10000, 15000, 17000,
                            16000, 18000, 23000,
                            22000, 24000, 28000,
                            26000, 27000, 30000
                        ],
                        tension: 0.4,
                        fill: false
                    }

                ]
            },

            options: {

                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        position: "top"
                    }
                }

            }

        });

    }

    // Loans vs Repayments Chart
    const loanCanvas =
        document.getElementById("loanChart");

    if (loanCanvas) {

        new Chart(loanCanvas, {

            type: "bar",

            data: {

                labels: [
                    "Jan", "Feb", "Mar", "Apr",
                    "May", "Jun", "Jul", "Aug",
                    "Sep", "Oct", "Nov", "Dec"
                ],

                datasets: [

                    {
                        label: "Loans Issued (ETB)",
                        data: [
                            100000, 120000, 145000,
                            160000, 180000, 205000,
                            225000, 198000, 165000,
                            172000, 168000, 145000
                        ]
                    },

                    {
                        label: "Repayments (ETB)",
                        data: [
                            60000, 62000, 85000,
                            90000, 102000, 130000,
                            145000, 110000, 120000,
                            76000, 97000, 85000
                        ]
                    }

                ]

            },

            options: {

                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        position: "top"
                    }
                }

            }

        });

    }

}

// ===============================
// DASHBOARD DATA UPDATE
// ===============================

function updateDashboardStats(data) {

    document.getElementById("totalMembers").textContent =
        data.members || 0;

    document.getElementById("totalSavings").textContent =
        data.savings || 0;

    document.getElementById("totalLoans").textContent =
        data.loans || 0;

    document.getElementById("totalWithdrawals").textContent =
        data.withdrawals || 0;

    document.getElementById("netProfit").textContent =
        data.profit || 0;
}

// Example usage:
//
// updateDashboardStats({
//     members: 250,
//     savings: "1,500,000 ETB",
//     loans: "850,000 ETB",
//     withdrawals: "200,000 ETB",
//     profit: "450,000 ETB"
// });
