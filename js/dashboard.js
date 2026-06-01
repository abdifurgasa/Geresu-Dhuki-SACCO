/* =========================
   SIDEBAR TOGGLE
========================= */

function toggleSidebar(){
    document.querySelector(".sidebar").classList.toggle("collapsed");
    document.querySelector(".main-content").classList.toggle("expanded");
}

/* =========================
   MENU ACTIVE STATE
========================= */

document.querySelectorAll(".menu li").forEach(item=>{
    item.addEventListener("click", ()=>{
        document.querySelectorAll(".menu li").forEach(i=>{
            i.classList.remove("active");
        });
        item.classList.add("active");
    });
});

/* =========================
   LOAD FIREBASE DATA
   (db comes from firebase.js)
========================= */

async function loadDashboard(){

    try{

        // MEMBERS COUNT
        const membersSnap = await db.collection("members").get();
        const membersCount = membersSnap.size;

        // SAVINGS TOTAL
        const savingsSnap = await db.collection("savings").get();
        let savingsTotal = 0;
        savingsSnap.forEach(doc=>{
            savingsTotal += doc.data().amount || 0;
        });

        // LOANS TOTAL
        const loansSnap = await db.collection("loans").get();
        let loansTotal = 0;
        loansSnap.forEach(doc=>{
            loansTotal += doc.data().amount || 0;
        });

        // UPDATE UI (no fake selectors)
        document.querySelector(".members h2").innerText = membersCount;
        document.querySelector(".savings h2").innerText = savingsTotal;
        document.querySelector(".loans h2").innerText = loansTotal;

        updateCharts(loansTotal, savingsTotal);

    }catch(error){
        console.error("Dashboard load error:", error);
    }
}

/* =========================
   CHARTS
========================= */

let barChart, lineChart;

function initCharts(){

    barChart = new Chart(document.getElementById("barChart"),{
        type:"bar",
        data:{
            labels:["Loans","Repayments"],
            datasets:[{
                label:"Amount",
                data:[0,0]
            }]
        }
    });

    lineChart = new Chart(document.getElementById("lineChart"),{
        type:"line",
        data:{
            labels:["Savings"],
            datasets:[{
                label:"Total Savings",
                data:[0],
                borderColor:"#17A8D4"
            }]
        }
    });
}

function updateCharts(loans, savings){

    barChart.data.datasets[0].data = [loans, loans * 0.8];
    barChart.update();

    lineChart.data.datasets[0].data = [savings];
    lineChart.update();
}

/* =========================
   INIT
========================= */

initCharts();
loadDashboard();
