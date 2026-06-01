import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ================= LOGIN ================= */
export async function login(email, password) {

  const userCredential =
    await signInWithEmailAndPassword(auth, email, password);

  const user = userCredential.user;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  let role = "user";
  let language = "en";

  if (snap.exists()) {
    role = snap.data().role || "user";
    language = snap.data().language || "en";
  }

  // save session
  localStorage.setItem("uid", user.uid);
  localStorage.setItem("role", role);
  localStorage.setItem("language", language);

  await updateDoc(ref, {
    lastLogin: serverTimestamp()
  });

  // redirect based on role
  if (role === "admin") {
    window.location.href = "admin.html";
  } else {
    window.location.href = "user.html";
  }
}
