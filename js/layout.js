import { auth } from "./firebase.js";

import {
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* =========================================================
   SIDEBAR TOGGLE
========================================================= */

window.toggleSidebar = function () {

  const sidebar = document.getElementById("sidebar");

  if (sidebar) {
    sidebar.classList.toggle("collapsed");
  }

};

/* =========================================================
   AUTH CHECK
========================================================= */

onAuthStateChanged(auth, (user) => {

  // if not logged in
  if (!user) {

    window.location.href = "./index.html";
    return;

  }

});

/* =========================================================
   LOGOUT SYSTEM
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {

    logoutBtn.addEventListener("click", async (e) => {

      e.preventDefault();

      const confirmLogout = confirm(
        "Are you sure you want to logout?"
      );

      if (!confirmLogout) return;

      try {

        // firebase logout
        await signOut(auth);

        // clear storage
        localStorage.clear();
        sessionStorage.clear();

        // redirect to login
        window.location.href = "./index.html";

      } catch (error) {

        console.error("Logout error:", error);

        alert("Logout failed");

      }

    });

  }

});

/* =========================================================
   SESSION TIMEOUT
========================================================= */

let timeout;

const TIME_LIMIT = 5 * 60 * 1000; // 5 minutes

function resetTimer() {

  clearTimeout(timeout);

  timeout = setTimeout(async () => {

    alert("Session expired. Logging out.");

    try {

      await signOut(auth);

    } catch (error) {

      console.error(error);

    }

    localStorage.clear();
    sessionStorage.clear();

    window.location.href = "./index.html";

  }, TIME_LIMIT);

}

/* =========================================================
   USER ACTIVITY TRACKING
========================================================= */

window.addEventListener("mousemove", resetTimer);
window.addEventListener("keydown", resetTimer);
window.addEventListener("click", resetTimer);
window.addEventListener("scroll", resetTimer);

resetTimer();
