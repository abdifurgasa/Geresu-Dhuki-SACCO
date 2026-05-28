import { db, auth } from "./firebase.js";

import {
  translations,
  initLanguage
} from "./i18n.js";

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  orderBy,
  limit,
  startAfter
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================================================
   INIT LANGUAGE
========================================================= */

initLanguage();

/* =========================================================
   ELEMENTS
========================================================= */

const membersTable =
  document.getElementById("membersTable");

const memberForm =
  document.getElementById("memberForm");

const modal =
  document.getElementById("memberModal");

const openModalBtn =
  document.getElementById("openModalBtn");

const closeModalBtn =
  document.getElementById("closeModalBtn");

const profileModal =
  document.getElementById("profileModal");

const closeProfileBtn =
  document.getElementById("closeProfileBtn");

/* =========================================================
   STATE
========================================================= */

let members = [];
let lastVisible = null;
let isLoading = false;

/* =========================================================
   GET LANGUAGE
========================================================= */

function getLang() {
  return localStorage.getItem("language") || "en";
}

/* =========================================================
   MODAL CONTROL
========================================================= */

openModalBtn?.addEventListener("click", () => {
  modal.classList.add("active");
});

closeModalBtn?.addEventListener("click", () => {
  modal.classList.remove("active");
});

window.addEventListener("click", (e) => {
  if (e.target === modal) modal.classList.remove("active");
  if (e.target === profileModal) profileModal.classList.remove("active");
});

/* =========================================================
   VALIDATION
========================================================= */

function validatePhone(phone) {
  return /^[0-9]{9}$/.test(phone);
}

function validateNID(nid) {
  return /^[0-9]{16}$/.test(nid);
}

/* =========================================================
   DUPLICATE CHECK
========================================================= */

async function checkDuplicate(phone, nid) {
  const phoneQ = query(collection(db, "members"), where("phone", "==", phone));
  const nidQ = query(collection(db, "members"), where("nid", "==", nid));

  const [pSnap, nSnap] = await Promise.all([
    getDocs(phoneQ),
    getDocs(nidQ)
  ]);

  return !pSnap.empty || !nSnap.empty;
}

/* =========================================================
   ADD MEMBER (FULL I18N)
========================================================= */

memberForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const lang = getLang();
  const t = translations[lang];

  const name =
    document.getElementById("name").value.trim();

  const phone =
    document.getElementById("phone").value.trim();

  const nid =
    document.getElementById("nid").value.trim();

  /* VALIDATION */

  if (!validatePhone(phone)) {
    alert(t.phoneError);
    return;
  }

  if (!validateNID(nid)) {
    alert(t.nidError);
    return;
  }

  const isDuplicate =
    await checkDuplicate(phone, nid);

  if (isDuplicate) {
    alert(t.duplicateError);
    return;
  }

  /* SAVE */

  await addDoc(collection(db, "members"), {
    name,
    phone,
    nid,
    status: t.active,
    createdAt: serverTimestamp(),
    createdBy:
      localStorage.getItem("name") ||
      auth.currentUser?.displayName ||
      "Admin"
  });

  memberForm.reset();
  modal.classList.remove("active");

  loadMembers(true);
});

/* =========================================================
   LOAD MEMBERS (FAST)
========================================================= */

async function loadMembers(reset = false) {

  if (isLoading) return;
  isLoading = true;

  if (reset) {
    members = [];
    lastVisible = null;
    membersTable.innerHTML = "";
  }

  let q = query(
    collection(db, "members"),
    orderBy("createdAt", "desc"),
    limit(20)
  );

  if (lastVisible) {
    q = query(
      collection(db, "members"),
      orderBy("createdAt", "desc"),
      startAfter(lastVisible),
      limit(20)
    );
  }

  const snap = await getDocs(q);

  if (snap.empty) {
    isLoading = false;
    return;
  }

  lastVisible =
    snap.docs[snap.docs.length - 1];

  snap.forEach(docSnap => {

    const m = docSnap.data();
    const id = docSnap.id;

    members.push({ id, ...m });

    const row =
      document.createElement("tr");

    row.style.cursor = "pointer";

    row.innerHTML = `
      <td><strong>${m.name}</strong></td>
      <td>${m.phone}</td>
      <td>${m.nid}</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>${m.status}</td>
      <td>${m.createdAt?.toDate?.().toLocaleString() || "-"}</td>
      <td>${m.createdBy || "-"}</td>
    `;

    row.onclick = () =>
      openProfile(id);

    membersTable.appendChild(row);

  });

  isLoading = false;
}

/* =========================================================
   PROFILE
========================================================= */

function openProfile(id) {

  const m =
    members.find(x => x.id === id);

  if (!m) return;

  profileModal.classList.add("active");

  document.getElementById("profileTitle").innerText =
    m.name;

  document.getElementById("profilePhone").innerText =
    m.phone;

  document.getElementById("profileNid").innerText =
    m.nid;

  document.getElementById("profileStatus").innerText =
    m.status;
}

/* =========================================================
   INIT
========================================================= */

loadMembers();
