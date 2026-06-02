import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* =========================================================
   SIDEBAR TOGGLE
========================================================= */
window.toggleSidebar = function () {
  const sidebar = document.getElementById("sidebar");
  if (sidebar) sidebar.classList.toggle("collapsed");
};

/* =========================================================
   AUTH CHECK (SAFE - NO FALSE LOGOUT)
========================================================= */
onAuthStateChanged(auth, (user) => {
  if (!user) {
    // wait a bit to avoid false logout
    setTimeout(() => {
      if (!auth.currentUser) {
        window.location.href = "./index.html";
      }
    }, 800);
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

      if (!confirm("Are you sure you want to logout?")) return;

      try {
        await signOut(auth);
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "./index.html";
      } catch (err) {
        console.error(err);
        alert("Logout failed");
      }
    });
  }
});

/* =========================================================
   ROLE SYSTEM (ADMIN / MANAGER / USER)
========================================================= */

function applyRoleAccess() {
  const role = localStorage.getItem("role") || "user";

  document.querySelectorAll("[data-role]").forEach(el => {
    const roles = el.getAttribute("data-role").split(" ");

    if (roles.includes(role)) {
      el.style.display = "";
    } else {
      el.style.display = "none";
    }
  });
}

applyRoleAccess();

/* =========================================================
   SESSION TIMEOUT (10 min)
========================================================= */

let timeout;
const TIME_LIMIT = 10 * 60 * 1000;

function resetTimer() {
  clearTimeout(timeout);

  timeout = setTimeout(async () => {
    alert("Session expired");

    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }

    localStorage.clear();
    window.location.href = "./index.html";
  }, TIME_LIMIT);
}

window.addEventListener("mousemove", resetTimer);
window.addEventListener("keydown", resetTimer);
window.addEventListener("click", resetTimer);
window.addEventListener("scroll", resetTimer);

resetTimer();
