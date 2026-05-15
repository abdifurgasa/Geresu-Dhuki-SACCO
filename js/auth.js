import { auth, db } from "./firebase.js";

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================
   LOGIN
========================= */
window.login = async function () {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {

    const userCred = await signInWithEmailAndPassword(auth, email, password);

    const uid = userCred.user.uid;

    const userSnap = await getDoc(doc(db, "users", uid));

    if (!userSnap.exists()) {
      alert("User profile not found");
      return;
    }

    const userData = userSnap.data();

    const role = userData.role || "member";

    // STORE SESSION
    sessionStorage.setItem("uid", uid);
    sessionStorage.setItem("role", role);
    sessionStorage.setItem("email", email);

    // REDIRECT
    window.location.href = "dashboard.html";

  } catch (err) {
    console.error(err);
    alert("Login failed: wrong email or password");
  }
};

/* =========================
   LOGOUT (FIXED)
========================= */
window.logoutUser = async function () {

  await signOut(auth);

  sessionStorage.clear();
  localStorage.clear();

  window.location.href = "index.html";
};

/* =========================
   AUTH GUARD (PROTECT PAGES)
========================= */
export function protectPage() {

  onAuthStateChanged(auth, (user) => {

    if (!user) {
      window.location.href = "index.html";
    }

  });

}

/* =========================
   ROLE HELPER (FIXED)
========================= */
export function getRole() {
  return sessionStorage.getItem("role") || "member";
}
