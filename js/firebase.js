import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { getAuth }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { getFirestore }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { getStorage }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

/* =========================================================
   FIREBASE CONFIG
========================================================= */

const firebaseConfig = {

  apiKey: "AIzaSyC4-9M6xgTHfwDdG6APm1Ha_g7TyQJfD_c",

  authDomain:
    "geresu-dhuki-sacco-d4de7.firebaseapp.com",

  projectId:
    "geresu-dhuki-sacco-d4de7",

  /* IMPORTANT FIX */
  storageBucket:
    "geresu-dhuki-sacco-d4de7.appspot.com",

  messagingSenderId:
    "379938868750",

  appId:
    "1:379938868750:web:782f5ff7f65665ae1cf65f",

  measurementId:
    "G-J309NM1J9G"

};

/* =========================================================
   INITIALIZE FIREBASE
========================================================= */

const app = initializeApp(firebaseConfig);

/* =========================================================
   SERVICES
========================================================= */

const auth = getAuth(app);

const db = getFirestore(app);

const storage = getStorage(app);

/* =========================================================
   EXPORTS
========================================================= */

export {
  app,
  auth,
  db,
  storage
};
