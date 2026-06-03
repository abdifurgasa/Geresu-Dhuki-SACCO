import { auth } from "./firebase.js";
import {
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* ==========================================
   SIDEBAR TOGGLE
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    const toggleBtn = document.getElementById("toggleBtn");
    const sidebar = document.getElementById("sidebar");
    const mainContent = document.getElementById("mainContent");

    if (toggleBtn && sidebar) {

        toggleBtn.addEventListener("click", () => {

            sidebar.classList.toggle("collapsed");

            if (mainContent) {
                mainContent.classList.toggle("expanded");
            }

        });

    }

});

/* ==========================================
   AUTH STATE
========================================== */

onAuthStateChanged(auth, (user) => {

    if (user) {

        console.log("Logged in:", user.email);

    } else {

        console.warn("No authenticated user");

        // DO NOT REDIRECT HERE
        // window.location.href = "index.html";

    }

});

/* ==========================================
   LOGOUT
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    const logoutBtn =
        document.querySelector(".logout-btn");

    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", async (e) => {

        e.preventDefault();

        const confirmed =
            confirm("Are you sure you want to logout?");

        if (!confirmed) return;

        try {

            await signOut(auth);

            localStorage.clear();
            sessionStorage.clear();

            window.location.href =
                "index.html";

        } catch (error) {

            console.error(error);

            alert("Logout failed");

        }

    });

});

/* ==========================================
   ROLE ACCESS
========================================== */

window.applyRoleAccess = function (role) {

    const adminOnly =
        document.querySelectorAll(".admin-only");

    const managerOnly =
        document.querySelectorAll(".manager-only");

    const userOnly =
        document.querySelectorAll(".user-only");

    adminOnly.forEach(el => {
        el.style.display =
            role === "admin"
                ? ""
                : "none";
    });

    managerOnly.forEach(el => {
        el.style.display =
            role === "admin" || role === "manager"
                ? ""
                : "none";
    });

    userOnly.forEach(el => {
        el.style.display =
            role === "user"
                ? ""
                : "none";
    });

};
