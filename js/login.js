import { auth, db } from "./js/firebase.js";

import { signInWithEmailAndPassword }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { doc, getDoc }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ================= LOGIN ================= */

document.addEventListener("DOMContentLoaded", () => {

  const btn = document.getElementById("loginBtn");

  btn.addEventListener("click", async () => {

    try {

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      if (!email || !password) {
        alert("Fill all fields");
        return;
      }

      // 🔐 LOGIN FIREBASE
      const userCredential =
        await signInWithEmailAndPassword(auth, email, password);

      const user = userCredential.user;

      // 📦 GET ROLE
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      let role = "user";

      if (snap.exists()) {
        role = snap.data().role || "user";
      }

      // 💾 SAVE SESSION
      localStorage.setItem("uid", user.uid);
      localStorage.setItem("role", role);

      // 🚀 REDIRECT FIX
      console.log("LOGIN SUCCESS → redirecting");

      if (role === "admin") {
        window.location.href = "dashboard.html"; // or admin.html
      } else {
        window.location.href = "dashboard.html";
      }

    }

    catch (error) {
      console.error(error);
      alert(error.message);
    }

  });

});
