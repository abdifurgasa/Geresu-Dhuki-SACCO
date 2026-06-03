import { db, auth } from "./firebase.js";

import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================
COLLECTIONS
========================= */

const membersCollection = collection(db,"members");
const savingsCollection = collection(db,"savings");
const transactionsCollection = collection(db,"transactions");

/* =========================
STATE
========================= */

let savings = [];
let filteredSavings = [];

let currentPage = 1;
const rowsPerPage = 10;

let selectedMember = null;

/* =========================
GLOBAL FUNCTIONS
========================= */

window.openAddSavingModal = openAddSavingModal;
window.closeModal = closeModal;
window.saveSaving = saveSaving;
window.deleteSaving = deleteSaving;
window.searchSavings = searchSavings;
window.nextPage = nextPage;
window.prevPage = prevPage;
window.openProfile = openProfile;
window.closeProfile = closeProfile;

/* =========================
ADD BUTTON
========================= */

document.addEventListener("DOMContentLoaded",()=>{

  const btn =
  document.getElementById("addSavingBtn");

  if(btn){

    btn.addEventListener(
      "click",
      openAddSavingModal
    );

  }

});

/* =========================
LOAD SAVINGS
========================= */

onSnapshot(
  savingsCollection,
  snapshot=>{

    savings = [];

    snapshot.forEach(docSnap=>{

      savings.push({
        id:docSnap.id,
        ...docSnap.data()
      });

    });

    filteredSavings = [...savings];

    updateTotals();

    renderTable();

  }
);

/* =========================
TOTALS
========================= */

function updateTotals(){

  const total =
  savings.reduce(
    (sum,item)=>
    sum + Number(item.amount || 0),
    0
  );

  const el =
  document.getElementById(
    "totalSavings"
  );

  if(el){

    el.textContent =
    total.toLocaleString();

  }

}

/* =========================
MODAL
========================= */

function openAddSavingModal(){

  document.getElementById(
    "savingModal"
  ).style.display = "flex";

}

function closeModal(){

  document.getElementById(
    "savingModal"
  ).style.display = "none";

}

/* =========================
SAVE SAVING
========================= */

async function saveSaving(){

try{

  if(!auth.currentUser){

    alert("Please login again");

    return;

  }

  const amount =
  Number(
    document
    .getElementById("amount")
    .value
  );

  if(!selectedMember){

    alert("Select member first");

    return;

  }

  if(amount <= 0){

    alert("Enter valid amount");

    return;

  }

  const previousBalance =
  calculateMemberBalance(
    selectedMember.id
  );

  const newBalance =
  previousBalance + amount;

  const createdBy =
  auth.currentUser.email;

  await addDoc(
    savingsCollection,
    {

      memberId:
      selectedMember.id,

      memberName:
      selectedMember.fullName,

      phone:
      selectedMember.phone,

      amount,

      previousBalance,

      newBalance,

      createdBy,

      createdAt:
      serverTimestamp()

    }
  );

  await addDoc(
    transactionsCollection,
    {

      memberId:
      selectedMember.id,

      type:"saving",

      amount,

      previousBalance,

      newBalance,

      createdBy,

      date:
      serverTimestamp()

    }
  );

  closeModal();

}
catch(error){

  console.error(error);

  alert(error.message);

}

}

/* =========================
MEMBER BALANCE
========================= */

function calculateMemberBalance(
memberId
){

let balance = 0;

savings.forEach(item=>{

  if(item.memberId === memberId){

    balance =
    Number(
      item.newBalance || 0
    );

  }

});

return balance;

}

/* =========================
SEARCH
========================= */

function searchSavings(){

const keyword =
document
.getElementById(
"searchInput"
)
.value
.toLowerCase();

filteredSavings =
savings.filter(item=>

(item.memberName || "")
.toLowerCase()
.includes(keyword)

||

(item.phone || "")
.includes(keyword)

);

currentPage = 1;

renderTable();

}

/* =========================
TABLE
========================= */

function renderTable(){

const tbody =
document.getElementById(
"savingsTable"
);

if(!tbody) return;

tbody.innerHTML = "";

const start =
(currentPage - 1)
* rowsPerPage;

const pageData =
filteredSavings.slice(
start,
start + rowsPerPage
);

pageData.forEach(item=>{

const tr =
document.createElement("tr");

tr.innerHTML = `

<td>${item.memberName || ""}</td>

<td>${item.phone || ""}</td>

<td>${Number(item.amount || 0).toLocaleString()}</td>

<td>${Number(item.previousBalance || 0).toLocaleString()}</td>

<td>${Number(item.newBalance || 0).toLocaleString()}</td>

<td>${formatDate(item.createdAt)}</td>

<td>${item.createdBy || "-"}</td>

<td>

<button
class="table-btn view-btn"
onclick="openProfile('${item.memberId}')">
<i class="fas fa-eye"></i>
</button>

<button
class="table-btn delete-btn"
onclick="deleteSaving('${item.id}')">
<i class="fas fa-trash"></i>
</button>

</td>

`;

tbody.appendChild(tr);

});

updatePageInfo();

}

/* =========================
DELETE
========================= */

async function deleteSaving(id){

try{

const confirmed =
confirm(
"Delete saving?"
);

if(!confirmed) return;

await deleteDoc(
doc(
db,
"savings",
id
)
);

}
catch(error){

alert(error.message);

}

}

/* =========================
PROFILE
========================= */

async function openProfile(
memberId
){

const memberSnap =
await getDoc(
doc(
db,
"members",
memberId
)
);

if(!memberSnap.exists())
return;

const member =
memberSnap.data();

document
.getElementById(
"profileContent"
)
.innerHTML = `

<h2>
${member.fullName}
</h2>

<p>
Phone:
${member.phone}
</p>

<p>
NID:
${member.nid}
</p>

`;

document
.getElementById(
"profileModal"
)
.style.display =
"flex";

}

function closeProfile(){

document
.getElementById(
"profileModal"
)
.style.display =
"none";

}

/* =========================
PAGINATION
========================= */

function updatePageInfo(){

const totalPages =
Math.ceil(
filteredSavings.length
/
rowsPerPage
) || 1;

document
.getElementById(
"pageInfo"
)
.textContent =
`Page ${currentPage} of ${totalPages}`;

}

function nextPage(){

const totalPages =
Math.ceil(
filteredSavings.length
/
rowsPerPage
);

if(
currentPage
<
totalPages
){

currentPage++;

renderTable();

}

}

function prevPage(){

if(
currentPage > 1
){

currentPage--;

renderTable();

}

}

/* =========================
DATE FORMAT
========================= */

function formatDate(
timestamp
){

if(!timestamp)
return "-";

if(timestamp.seconds){

return new Date(
timestamp.seconds
*
1000
)
.toLocaleString();

}

return "-";

}
