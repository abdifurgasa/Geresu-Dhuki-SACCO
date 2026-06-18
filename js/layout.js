import { auth } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

/* ==========================================
   AUTH GUARD
========================================== */

onAuthStateChanged(auth, async (user) => {

  if (!user) {

    console.warn("User not authenticated");

    // redirect only if not already on login page
    if (
      !window.location.pathname.includes("index.html") &&
      !window.location.pathname.endsWith("/")
    ) {
      window.location.href = "index.html";
    }

    return;
  }

  console.log("Logged in:", user.email);

  const roleBox = document.getElementById("roleBox");

  if (roleBox) {
    roleBox.innerHTML = `👤 ${user.email}`;
  }

  if (window.loadUserRole) {
    await window.loadUserRole(user.uid);
  }

});

/* ==========================================
   LOGOUT
========================================== */

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

  logoutBtn.addEventListener("click", async (e) => {

    e.preventDefault();

    await signOut(auth);

    localStorage.clear();
    sessionStorage.clear();

    window.location.href = "index.html";

  });

}

/* ==========================================
   SIDEBAR
========================================== */

window.toggleSidebar = function () {

  const sidebar = document.getElementById("sidebar");

  if (sidebar) {
    sidebar.classList.toggle("collapsed");
  }

};
