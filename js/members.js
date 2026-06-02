import { db, auth } from "./firebase.js";

import {
collection,
addDoc,
updateDoc,
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

const membersCollection = collection(db,"members");
const transactionsCollection = collection(db,"transactions");

let members = [];
let filteredMembers = [];

let currentPage = 1;
const rowsPerPage = 10;

let editingId = null;

/* ==========================
LOAD MEMBERS
========================== */

onSnapshot(
membersCollection,
(snapshot)=>{

members = [];

snapshot.forEach(docSnap=>{

members.push({
id:docSnap.id,
...docSnap.data()
});

});

filteredMembers = [...members];

updateMembersCount();

renderTable();

}
);

/* ==========================
TOTAL MEMBERS
========================== */

function updateMembersCount(){

document.getElementById("totalMembers").textContent =
members.length;

}

/* ==========================
SEARCH
========================== */

window.searchMembers = function(){

const keyword =
document.getElementById("searchInput")
.value
.toLowerCase()
.trim();

filteredMembers = members.filter(member=>{

return (

(member.fullName || "")
.toLowerCase()
.includes(keyword)

||

(member.phone || "")
.includes(keyword)

||

(member.nid || "")
.includes(keyword)

);

});

currentPage = 1;

renderTable();

};

/* ==========================
PAGINATION
========================== */

function renderTable(){

const tbody =
document.getElementById("membersTable");

tbody.innerHTML = "";

const start =
(currentPage-1)*rowsPerPage;

const end =
start+rowsPerPage;

const pageData =
filteredMembers.slice(start,end);

pageData.forEach(member=>{

const tr =
document.createElement("tr");

tr.innerHTML = `

<td>${member.fullName || ""}</td>

<td>${member.phone || ""}</td>

<td>${member.nid || ""}</td>

<td>
<span class="status-badge">
${member.status || ""}
</span>
</td>

<td>
${formatDate(member.createdAt)}
</td>

<td>
${member.createdBy || "-"}
</td>

<td>

<button
class="table-btn view-btn"
onclick="openProfile('${member.id}')"
>
<i class="fas fa-eye"></i>
</button>

<button
class="table-btn edit-btn"
onclick="editMember('${member.id}')"
>
<i class="fas fa-pen"></i>
</button>

<button
class="table-btn delete-btn"
onclick="deleteMemberConfirm('${member.id}')"
>
<i class="fas fa-trash"></i>
</button>

</td>

`;

tbody.appendChild(tr);

});

updatePageInfo();

}

function updatePageInfo(){

const totalPages =
Math.ceil(
filteredMembers.length /
rowsPerPage
) || 1;

document.getElementById("pageInfo")
.textContent =
`Page ${currentPage} of ${totalPages}`;

}

window.nextPage = function(){

const totalPages =
Math.ceil(
filteredMembers.length /
rowsPerPage
);

if(currentPage < totalPages){

currentPage++;

renderTable();

}

};

window.prevPage = function(){

if(currentPage > 1){

currentPage--;

renderTable();

}

};

/* ==========================
DATE FORMAT
========================== */

function formatDate(timestamp){

if(!timestamp) return "-";

if(timestamp.seconds){

return new Date(
timestamp.seconds*1000
).toLocaleString();

}

return "-";

}
/* ==========================
MODAL FUNCTIONS
========================== */

window.openAddModal = function(){

editingId = null;

document.getElementById("modalTitle").textContent =
"Add Member";

document.getElementById("memberId").value = "";
document.getElementById("fullName").value = "";
document.getElementById("phone").value = "";
document.getElementById("nid").value = "";
document.getElementById("status").value = "Active";

document.getElementById("memberModal")
.style.display = "flex";

};

window.closeModal = function(){

document.getElementById("memberModal")
.style.display = "none";

};

/* ==========================
EDIT MEMBER
========================== */

window.editMember = async function(memberId){

try{

const memberRef =
doc(db,"members",memberId);

const memberSnap =
await getDoc(memberRef);

if(!memberSnap.exists()) return;

const member =
memberSnap.data();

editingId = memberId;

document.getElementById("modalTitle")
.textContent =
"Edit Member";

document.getElementById("memberId")
.value =
memberId;

document.getElementById("fullName")
.value =
member.fullName || "";

document.getElementById("phone")
.value =
member.phone || "";

document.getElementById("nid")
.value =
member.nid || "";

document.getElementById("status")
.value =
member.status || "Active";

document.getElementById("memberModal")
.style.display =
"flex";

}
catch(error){

console.error(error);

alert(error.message);

}

};

/* ==========================
SAVE MEMBER
========================== */

window.saveMember = async function(){

try{

const fullName =
document.getElementById("fullName")
.value
.trim();

const phone =
document.getElementById("phone")
.value
.trim();

const nid =
document.getElementById("nid")
.value
.trim();

const status =
document.getElementById("status")
.value;

/* ==========================
VALIDATION
========================== */

if(!fullName){

alert("Full Name required");

return;

}

if(!/^\d{9}$/.test(phone)){

alert("Phone number must be exactly 9 digits");

return;

}

if(!/^\d{16}$/.test(nid)){

alert("NID must be exactly 16 digits");

return;

}

/* ==========================
DUPLICATE PHONE
========================== */

const phoneQuery =
query(
membersCollection,
where("phone","==",phone)
);

const phoneSnap =
await getDocs(phoneQuery);

let duplicatePhone = false;

phoneSnap.forEach(docSnap=>{

if(docSnap.id !== editingId){

duplicatePhone = true;

}

});

if(duplicatePhone){

alert("Phone already exists");

return;

}

/* ==========================
DUPLICATE NID
========================== */

const nidQuery =
query(
membersCollection,
where("nid","==",nid)
);

const nidSnap =
await getDocs(nidQuery);

let duplicateNid = false;

nidSnap.forEach(docSnap=>{

if(docSnap.id !== editingId){

duplicateNid = true;

}

});

if(duplicateNid){

alert("NID already exists");

return;

}

/* ==========================
CURRENT USER
========================== */

const currentUser =
auth.currentUser;

const createdBy =
currentUser?.displayName ||
currentUser?.email ||
"System";

/* ==========================
ADD MEMBER
========================== */

if(!editingId){

await addDoc(
membersCollection,
{
fullName,
phone,
nid,
status,

createdAt:
serverTimestamp(),

createdBy,

updatedAt:
serverTimestamp()
}
);

}

/* ==========================
UPDATE MEMBER
========================== */

else{

await updateDoc(

doc(db,"members",editingId),

{
fullName,
phone,
nid,
status,

updatedAt:
serverTimestamp()
}

);

}

closeModal();

}
catch(error){

console.error(error);

alert(error.message);

}

};

/* ==========================
DELETE MEMBER
========================== */

window.deleteMemberConfirm =
async function(memberId){

try{

const confirmed =
confirm(
"Delete this member?"
);

if(!confirmed) return;

/* ==========================
CHECK TRANSACTIONS
========================== */

const txQuery =
query(
transactionsCollection,
where("memberId","==",memberId)
);

const txSnap =
await getDocs(txQuery);

if(!txSnap.empty){

alert(
"Cannot delete member because transactions exist."
);

return;

}

/* ==========================
DELETE
========================== */

await deleteDoc(
doc(db,"members",memberId)
);

}
catch(error){

console.error(error);

alert(error.message);

}

};
/* ==========================
PROFILE MODAL
========================== */

window.closeProfile = function(){

document.getElementById("profileModal")
.style.display = "none";

};

/* ==========================
OPEN MEMBER PROFILE
========================== */

window.openProfile = async function(memberId){

try{

const memberRef =
doc(db,"members",memberId);

const memberSnap =
await getDoc(memberRef);

if(!memberSnap.exists()){

alert("Member not found");

return;

}

const member =
memberSnap.data();

/* ==========================
LOAD TRANSACTIONS
========================== */

const txQuery =
query(
transactionsCollection,
where("memberId","==",memberId)
);

const txSnap =
await getDocs(txQuery);

/* ==========================
CALCULATIONS
========================== */

let totalSavings = 0;
let totalWithdrawals = 0;
let totalLoans = 0;
let totalRepayments = 0;

let transactionRows = "";

txSnap.forEach(docSnap=>{

const tx = docSnap.data();

const amount =
Number(tx.amount || 0);

switch(tx.type){

case "saving":

totalSavings += amount;

break;

case "withdrawal":

totalWithdrawals += amount;

break;

case "loan":

totalLoans += amount;

break;

case "repayment":

totalRepayments += amount;

break;

}

/* ==========================
TRANSACTION ROW
========================== */

transactionRows += `

<tr>

<td>${tx.type || "-"}</td>

<td>
${amount.toLocaleString()}
</td>

<td>
${tx.previousBalance || 0}
</td>

<td>
${tx.newBalance || 0}
</td>

<td>
${formatDate(tx.date)}
</td>

<td>
${tx.createdBy || "-"}
</td>

</tr>

`;

});

/* ==========================
FINAL TOTALS
========================== */

const savingBalance =
totalSavings - totalWithdrawals;

const remainingLoan =
totalLoans - totalRepayments;

const netPosition =
savingBalance - remainingLoan;

/* ==========================
PROFILE UI
========================== */

document.getElementById("profileContent")
.innerHTML = `

<div class="member-profile">

    <div class="profile-header">

        <div class="profile-avatar">

            <i class="fas fa-user"></i>

        </div>

        <div class="profile-details">

            <h2>
                ${member.fullName || ""}
            </h2>

            <p>
                <strong>Phone:</strong>
                ${member.phone || "-"}
            </p>

            <p>
                <strong>NID:</strong>
                ${member.nid || "-"}
            </p>

            <p>
                <strong>Status:</strong>
                ${member.status || "-"}
            </p>

            <p>
                <strong>Created At:</strong>
                ${formatDate(member.createdAt)}
            </p>

            <p>
                <strong>Created By:</strong>
                ${member.createdBy || "-"}
            </p>

        </div>

    </div>

    <div class="profile-stats">

        <div class="profile-card-stat">

            <span>Savings Balance</span>

            <h3>
                ${savingBalance.toLocaleString()}
            </h3>

        </div>

        <div class="profile-card-stat">

            <span>Total Loans</span>

            <h3>
                ${totalLoans.toLocaleString()}
            </h3>

        </div>

        <div class="profile-card-stat">

            <span>Total Repayments</span>

            <h3>
                ${totalRepayments.toLocaleString()}
            </h3>

        </div>

        <div class="profile-card-stat">

            <span>Remaining Loan</span>

            <h3>
                ${remainingLoan.toLocaleString()}
            </h3>

        </div>

        <div class="profile-card-stat">

            <span>Net Position</span>

            <h3>
                ${netPosition.toLocaleString()}
            </h3>

        </div>

    </div>

    <div class="table-container">

        <table class="members-table">

            <thead>

                <tr>

                    <th>Type</th>

                    <th>Amount</th>

                    <th>Previous</th>

                    <th>Balance</th>

                    <th>Date</th>

                    <th>Created By</th>

                </tr>

            </thead>

            <tbody>

                ${transactionRows}

            </tbody>

        </table>

    </div>

</div>

`;

document.getElementById("profileModal")
.style.display =
"flex";

}
catch(error){

console.error(error);

alert(error.message);

}

};
