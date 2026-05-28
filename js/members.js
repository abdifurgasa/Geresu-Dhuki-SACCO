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
  startAfter,
  doc,
  deleteDoc,
  updateDoc
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

let editMode = false;
let editId = null;

/* =========================================================
   LANGUAGE
========================================================= */

function getLang() {
  return localStorage.getItem("language") || "en";
}

/* =========================================================
   MODALS
========================================================= */

openModalBtn?.addEventListener("click", () => {
  modal.classList.add("active");
});

closeModalBtn?.addEventListener("click", () => {
  modal.classList.remove("active");
  resetForm();
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

async function checkDuplicate(phone, nid, ignoreId = null) {
  const phoneQ = query(collection(db, "members"), where("phone", "==", phone));
  const nidQ = query(collection(db, "members"), where("nid", "==", nid));

  const [pSnap, nSnap] = await Promise.all([
    getDocs(phoneQ),
    getDocs(nidQ)
  ]);

  const phoneExists = pSnap.docs.some(d => d.id !== ignoreId);
  const nidExists = nSnap.docs.some(d => d.id !== ignoreId);

  return phoneExists || nidExists;
}

/* =========================================================
   SUBMIT (ADD + EDIT)
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

  if (!validatePhone(phone)) return alert(t.phoneError);
  if (!validateNID(nid)) return alert(t.nidError);

  const isDuplicate =
    await checkDuplicate(phone, nid, editId);

  if (isDuplicate) return alert(t.duplicateError);

  /* EDIT MODE */
  if (editMode) {

    const ref = doc(db, "members", editId);

    await updateDoc(ref, {
      name,
      phone,
      nid
    });

    editMode = false;
    editId = null;

  } else {

    /* ADD MODE */
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
  }

  memberForm.reset();
  modal.classList.remove("active");

  loadMembers(true);
});

/* =========================================================
   LOAD MEMBERS
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

    row.innerHTML = `
      <td>${m.name}</td>
      <td>${m.phone}</td>
      <td>${m.nid}</td>
      <td>${m.status}</td>
      <td>${m.createdAt?.toDate?.().toLocaleString() || "-"}</td>
      <td>${m.createdBy || "-"}</td>

      <td>
        <button onclick="editMember('${id}')" class="edit-btn">✏️</button>
        <button onclick="deleteMember('${id}')" class="delete-btn">🗑️</button>
      </td>
    `;

    membersTable.appendChild(row);
  });

  isLoading = false;
}

/* =========================================================
   EDIT MEMBER
========================================================= */

window.editMember = (id) => {

  const m =
    members.find(x => x.id === id);

  if (!m) return;

  editMode = true;
  editId = id;

  document.getElementById("name").value = m.name;
  document.getElementById("phone").value = m.phone;
  document.getElementById("nid").value = m.nid;

  modal.classList.add("active");
};

/* =========================================================
   DELETE MEMBER
========================================================= */

window.deleteMember = async (id) => {

  const lang = getLang();
  const t = translations[lang];

  if (!confirm(t.deleteConfirm || "Delete this member?")) return;

  await deleteDoc(doc(db, "members", id));

  members = members.filter(m => m.id !== id);

  loadMembers(true);
};

/* =========================================================
   RESET FORM
========================================================= */

function resetForm() {
  editMode = false;
  editId = null;
  memberForm.reset();
}

/* =========================================================
   INIT
========================================================= */

loadMembers();
