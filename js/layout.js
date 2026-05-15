import { auth } from "./firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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
   LOGOUT SYSTEM
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const confirmLogout = confirm("Are you sure you want to logout?");
      if (!confirmLogout) return;

      try {
        if (auth.currentUser) {
          await signOut(auth);
        }

        localStorage.clear();

        window.location.href =
          "/Geresu-Dhuki-Credit-and-Saving-Cooperative/index.html";

      } catch (error) {
        console.error("Logout error:", error);
        alert("Logout failed");
      }
    });
  }
});

/* =========================================================
   SESSION TIMEOUT (5 MINUTES)
========================================================= */

let timeout;
const TIME_LIMIT = 5 * 60 * 1000;

function resetTimer() {
  clearTimeout(timeout);

  timeout = setTimeout(async () => {
    alert("Session expired. You will be logged out.");

    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch (e) {
      console.error(e);
    }

    localStorage.clear();

    window.location.href =
      "/Geresu-Dhuki-Credit-and-Saving-Cooperative/index.html";

  }, TIME_LIMIT);
}

/* user activity tracking */
window.addEventListener("mousemove", resetTimer);
window.addEventListener("keydown", resetTimer);
window.addEventListener("click", resetTimer);
window.addEventListener("scroll", resetTimer);

resetTimer();
