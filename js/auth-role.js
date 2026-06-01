import { db, auth } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* GET USER ROLE FROM FIREBASE */
export async function getUserRole() {
  const user = auth.currentUser;
  if (!user) return null;

  const snap = await getDoc(doc(db, "users", user.uid));

  if (!snap.exists()) {
    return { name: "Unknown User", role: "user" };
  }

  return snap.data();
}

/* SHOW / HIDE ADMIN FEATURES */
export function applyRole(role) {
  document.querySelectorAll(".admin-only").forEach(el => {
    if (role === "admin") {
      el.style.display = "";
    } else {
      el.style.display = "none";
    }
  });
}
