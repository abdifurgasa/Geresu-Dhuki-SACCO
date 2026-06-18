import { auth, db } from "./firebase.js";

import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {

  const btn = document.getElementById("loginBtn");

  if (!btn) return;

  btn.addEventListener("click", async () => {

    try {

      const email =
        document.getElementById("email").value.trim();

      const password =
        document.getElementById("password").value;

      if (!email || !password) {
        alert("Please fill all fields");
        return;
      }

      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

      const user = userCredential.user;

      console.log("Login success:", user.email);

      let role = "user";

      const snap = await getDoc(
        doc(db, "users", user.uid)
      );

      if (snap.exists()) {
        role = snap.data().role || "user";
      }

      localStorage.setItem("uid", user.uid);
      localStorage.setItem("role", role);

      window.location.href = "dashboard.html";

    } catch (error) {

      console.error("LOGIN ERROR:", error);

      alert(error.message);

    }

  });

});
