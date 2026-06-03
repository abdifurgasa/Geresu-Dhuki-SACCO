import { db, auth } from "./firebase.js";

import {
collection,
addDoc,
onSnapshot,
doc,
getDoc,
updateDoc,
query,
getDocs,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* COLLECTIONS */
const withdrawalsCollection = collection(db, "withdrawals");
const membersCollection = collection(db, "members");

/* STATE */
let withdrawals = [];
let members = [];
let filtered = [];

/* GLOBAL */
window.openAddModal = openAddModal;
window.closeModal = closeModal;
window.saveWithdrawal = saveWithdrawal;
window.searchWithdrawals = searchWithdrawals;

/* LOAD MEMBERS */
onSnapshot(membersCollection, (snap) => {

    members = [];

    snap.forEach(d => members.push({ id: d.id, ...d.data() }));

    const select = document.getElementById("memberSelect");
    if (!select) return;

    select.innerHTML = `<option value="">Select Member</option>`;

    members.forEach(m => {
        select.innerHTML += `
            <option value="${m.id}">
                ${m.fullName} - ${m.phone}
            </option>
        `;
    });
});

/* MEMBER AUTO FILL */
document.addEventListener("change", (e) => {
    if (e.target.id === "memberSelect") {
        const m = members.find(x => x.id === e.target.value);
        if (m) document.getElementById("phone").value = m.phone;
    }
});

/* LOAD WITHDRAWALS */
onSnapshot(withdrawalsCollection, (snap) => {

    withdrawals = [];

    snap.forEach(d => {
        withdrawals.push({ id: d.id, ...d.data() });
    });

    filtered = [...withdrawals];

    updateCount();
    render();
});

/* MODAL */
function openAddModal() {
    document.getElementById("withdrawalModal").style.display = "flex";
}

function closeModal() {
    document.getElementById("withdrawalModal").style.display = "none";
}

/* SAVE */
async function saveWithdrawal() {

    try {

        const user = auth.currentUser;
        if (!user) return alert("Session expired");

        const memberId = document.getElementById("memberSelect").value;
        const amount = Number(document.getElementById("amount").value);
        const reason = document.getElementById("reason").value;

        if (!memberId) return alert("Select member");
        if (!amount) return alert("Invalid amount");
        if (!reason) return alert("Enter reason");

        const ref = doc(db, "members", memberId);
        const snap = await getDoc(ref);

        const member = snap.data();

        const before = Number(member.savings || 0);

        if (amount > before) return alert("Insufficient balance");

        const after = before - amount;

        await updateDoc(ref, {
            savings: after,
            updatedAt: serverTimestamp()
        });

        await addDoc(withdrawalsCollection, {
            memberId,
            name: member.fullName,
            phone: member.phone,
            amount,
            reason,
            balanceBefore: before,
            balanceAfter: after,
            createdBy: user.email,
            createdAt: serverTimestamp()
        });

        closeModal();

    } catch (e) {
        console.error(e);
        alert(e.message);
    }
}

/* SEARCH */
function searchWithdrawals() {

    const k = document.getElementById("searchInput").value.toLowerCase();

    filtered = withdrawals.filter(w =>
        (w.name || "").toLowerCase().includes(k) ||
        (w.phone || "").includes(k)
    );

    render();
}

/* RENDER */
function render() {

    const tbody = document.getElementById("withdrawalsTable");
    if (!tbody) return;

    tbody.innerHTML = "";

    filtered.forEach(w => {

        tbody.innerHTML += `
        <tr>
            <td>${w.name}</td>
            <td>${w.phone}</td>
            <td>${w.amount}</td>
            <td>${w.reason}</td>
            <td>${w.balanceBefore}</td>
            <td>${w.balanceAfter}</td>
            <td>${w.createdAt?.seconds ? new Date(w.createdAt.seconds * 1000).toLocaleDateString() : "-"}</td>
            <td>${w.createdBy}</td>
        </tr>`;
    });
}

/* COUNT */
function updateCount() {
    document.getElementById("totalWithdrawals").textContent = withdrawals.length;
}
