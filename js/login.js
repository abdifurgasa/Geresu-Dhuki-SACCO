import { auth, db } from "./firebase.js";

import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================
   LOGIN FUNCTION
========================= */
window.login = async function () {

  console.log("LOGIN CLICKED");

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const msg = document.getElementById("msg");

  msg.innerText = "";

  if (!email || !password) {
    msg.innerText = "Please enter email and password";
    return;
  }

  try {

    // 🔐 Firebase login
    const userCred = await signInWithEmailAndPassword(auth, email, password);

    const uid = userCred.user.uid;

    // 👮 Get role from Firestore
    const snap = await getDoc(doc(db, "users", uid));

    let role = "member"; // SAFE DEFAULT

    if (snap.exists()) {
      role = snap.data().role;
    }

    // 💾 Save role
    localStorage.setItem("role", role);

    console.log("LOGIN SUCCESS ROLE:", role);

    // 🚀 Redirect
    window.location.href = "dashboard.html";

  } catch (error) {

    console.error(error);
    msg.innerText = error.message;

  }

};
