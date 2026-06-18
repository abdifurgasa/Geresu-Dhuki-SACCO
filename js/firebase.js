import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";

import {
  getAuth,
  setPersistence,
  browserLocalPersistence
}
from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

import { getFirestore }
from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC4-9M6xgTHfwDdG6APm1Ha_g7TyQJfD_c",
  authDomain: "geresu-dhuki-sacco-d4de7.firebaseapp.com",
  projectId: "geresu-dhuki-sacco-d4de7",
  storageBucket: "geresu-dhuki-sacco-d4de7.firebasestorage.app",
  messagingSenderId: "379938868750",
  appId: "1:379938868750:web:782f5ff7f65665ae1cf65f",
  measurementId: "G-J309NM1J9G"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

await setPersistence(
  auth,
  browserLocalPersistence
);

const db = getFirestore(app);

export { app, auth, db };
