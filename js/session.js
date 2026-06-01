import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { auth } from "./firebase.js";

let warningTimer;
let logoutTimer;

// ⚙️ CONFIG (bank style)
const WARNING_TIME = 4 * 60 * 1000; // 4 min
const LOGOUT_TIME = 5 * 60 * 1000;  // 5 min

function resetTimer() {

  clearTimeout(warningTimer);
  clearTimeout(logoutTimer);

  // ⚠️ show warning before logout
  warningTimer = setTimeout(() => {
    showWarning();
  }, WARNING_TIME);

  // 🔒 auto logout
  logoutTimer = setTimeout(() => {
    logoutUser();
  }, LOGOUT_TIME);

}

// ⚠️ WARNING UI
function showWarning() {

  const box = document.createElement("div");

  box.id = "sessionWarning";
  box.innerHTML = `
    <div style="
      position:fixed;
      top:20px;
      right:20px;
      background:rgba(0,0,0,0.85);
      color:white;
      padding:15px;
      border-radius:12px;
      z-index:9999;
      font-family:sans-serif;
    ">
      ⚠️ Session will expire soon!
      <br><br>
      <button id="stayBtn">Stay Logged In</button>
    </div>
  `;

  document.body.appendChild(box);

  document.getElementById("stayBtn").onclick = () => {
    box.remove();
    resetTimer();
  };

}

// 🔒 LOGOUT FUNCTION
async function logoutUser() {

  try {
    await signOut(auth);
  } catch (e) {
    console.log(e);
  }

  localStorage.clear();
  window.location.href = "index.html";
}

// 🧠 ACTIVITY LISTENERS
window.onload = resetTimer;
document.onmousemove = resetTimer;
document.onkeydown = resetTimer;
document.ontouchstart = resetTimer;
