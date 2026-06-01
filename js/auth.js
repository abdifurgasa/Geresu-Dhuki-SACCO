import { auth, db } from "./firebase.js";

import {
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ================= LOGIN ================= */
window.login = async function () {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {

    // 🔥 CRITICAL FIX (PREVENT LOGOUT)
    await setPersistence(auth, browserLocalPersistence);

    const cred =
      await signInWithEmailAndPassword(auth, email, password);

    const uid = cred.user.uid;

    const snap =
      await getDoc(doc(db, "users", uid));

    let role = "member";

    if (snap.exists()) {
      role = snap.data().role || "member";
    }

    // store UI only (NOT AUTH)
    localStorage.setItem("role", role);

    // redirect ONLY after auth stable
    window.location.href = "dashboard.html";

  } catch (e) {
    alert(e.message);
  }
};

/* ================= LOGOUT ================= */
window.logout = async function () {

  await signOut(auth);

  localStorage.clear();
  window.location.href = "index.html";
};
