import { db, auth } from "./firebase.js";

import {
doc,
getDoc,
setDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================
SETTINGS DOC
========================= */

const settingsRef = doc(db, "system", "settings");

/* =========================
LOAD SETTINGS
========================= */

async function loadSettings() {

const snap = await getDoc(settingsRef);

if (!snap.exists()) return;

const data = snap.data();

document.getElementById("saccoName").value = data.saccoName || "";
document.getElementById("currency").value = data.currency || "";
document.getElementById("interestRate").value = data.interestRate || "";
document.getElementById("maxLoan").value = data.maxLoan || "";
document.getElementById("minSaving").value = data.minSaving || "";
document.getElementById("sessionTimeout").value = data.sessionTimeout || "";

}

/* =========================
SAVE SETTINGS
========================= */

window.saveSettings = async function () {

try {

const user = auth.currentUser;

if (!user) {
alert("Session expired. Please login again.");
return;
}

await setDoc(settingsRef, {

saccoName: document.getElementById("saccoName").value,
currency: document.getElementById("currency").value,
interestRate: Number(document.getElementById("interestRate").value),
maxLoan: Number(document.getElementById("maxLoan").value),
minSaving: Number(document.getElementById("minSaving").value),
sessionTimeout: Number(document.getElementById("sessionTimeout").value),

updatedBy: user.email,
updatedAt: serverTimestamp()

}, { merge: true });

alert("Settings saved successfully");

} catch (err) {
console.error(err);
alert(err.message);
}

};

/* =========================
INIT
========================= */

loadSettings();
