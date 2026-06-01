import { db } from "./firebase.js";
import { collection, onSnapshot } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let savings = 0;
let loans = 0;

/* MEMBERS */
onSnapshot(collection(db,"members"), snap=>{
  document.getElementById("members").innerText = snap.size;
});

/* SAVINGS */
onSnapshot(collection(db,"savings"), snap=>{
  savings = 0;
  snap.forEach(d=>{
    savings += Number(d.data().amount || 0);
  });

  document.getElementById("savings").innerText = savings + " ETB";
  update();
});

/* LOANS */
onSnapshot(collection(db,"loans"), snap=>{
  loans = 0;
  snap.forEach(d=>{
    loans += Number(d.data().amount || 0);
  });

  document.getElementById("loans").innerText = loans + " ETB";
  update();
});

/* PROFIT */
function update(){
  document.getElementById("profit").innerText =
    (savings - loans) + " ETB";

  drawChart();
}

/* CHART */
let chart;

function drawChart(){

  const ctx = document.getElementById("chart");

  if(chart) chart.destroy();

  chart = new Chart(ctx,{
    type:"line",
    data:{
      labels:["Savings","Loans"],
      datasets:[{
        data:[savings,loans],
        borderColor:"#3b82f6",
        tension:0.4
      }]
    }
  });

}
