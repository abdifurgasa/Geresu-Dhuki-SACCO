import { auth } from "./firebase.js";

import {
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* =========================
   LOGOUT
========================= */
window.logoutUser = async function () {

  try {

    await signOut(auth);

    localStorage.clear();

    window.location.href = "index.html";

  } catch (error) {

    console.error(error);

    alert("Logout failed");

  }

};

/* =========================
   LANGUAGE
========================= */
window.changeLang = function(lang){

  localStorage.setItem("lang", lang);

  location.reload();

};

/* =========================
   ROLE SYSTEM
========================= */
const role = localStorage.getItem("role");

if(role !== "admin"){

  document.querySelectorAll(".admin-only")
    .forEach(el => {

      el.style.display = "none";

    });

}

/* =========================
   SIDEBAR
========================= */
window.toggleSidebar = function(){

  const sidebar = document.getElementById("sidebar");

  sidebar.classList.toggle("collapsed");

  localStorage.setItem(
    "sidebar",
    sidebar.classList.contains("collapsed")
  );

};

/* RESTORE SIDEBAR */
window.addEventListener("load", () => {

  const sidebar = document.getElementById("sidebar");

  if(localStorage.getItem("sidebar") === "true"){

    sidebar.classList.add("collapsed");

  }

});
