import { auth, db } from "./js/firebase.js";

import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

window.login = async function () {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Please fill all fields");
    return;
  }

  try {

    // 🔐 Firebase login
    const userCredential =
      await signInWithEmailAndPassword(auth, email, password);

    const user = userCredential.user;

    // 📦 Get user role from Firestore
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    let role = "user";
    let language = "en";

    if (userSnap.exists()) {
      role = userSnap.data().role || "user";
      language = userSnap.data().language || "en";
    }

    // 💾 Save session
    localStorage.setItem("uid", user.uid);
    localStorage.setItem("role", role);
    localStorage.setItem("language", language);

    // 🚀 REDIRECT FIX (THIS IS WHAT YOU ARE MISSING)
    if (role === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "dashboard.html";
    }

  }

  catch (error) {
    console.error(error);
    alert(error.message);
  }
};
