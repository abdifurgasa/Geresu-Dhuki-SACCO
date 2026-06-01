import { auth } from "./firebase.js";
import { onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* ================= PAGE PROTECTION ================= */

onAuthStateChanged(auth, (user) => {

  if (!user) {

    // ❌ ONLY redirect if Firebase CONFIRMS no user
    window.location.href = "index.html";
    return;
  }

  console.log("AUTH OK:", user.email);

  // allow page to load safely
  document.body.style.display = "block";

});
