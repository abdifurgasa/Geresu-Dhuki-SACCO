import { auth } from "./firebase.js";
import {
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* ==========================================
   AUTH STATE (FIXED)
========================================== */

onAuthStateChanged(auth, (user) => {

    if (!user) {
        console.warn("No authenticated user (waiting or logged out)");
        return;
    }

    console.log("Logged in:", user.email);

    // 🔥 IMPORTANT: call role system AFTER auth is ready
    if (window.loadUserRole) {
        window.loadUserRole(user.uid);
    }

});
