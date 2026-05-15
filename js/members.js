import { db, storage, auth } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

/* =========================
   ELEMENTS
========================= */
const modal = document.getElementById("memberModal");
const openBtn = document.getElementById("openModalBtn");
const closeBtn = document.getElementById("closeModalBtn");

const form = document.getElementById("memberForm");
const photoInput = document.getElementById("photo");
const photoPreview = document.getElementById("photoPreview");

const table = document.getElementById("membersTable");

/* =========================
   MODAL FIX (IMPORTANT)
========================= */
function openModal() {
  modal.style.display = "flex";
}

function closeModal() {
  modal.style.display = "none";
}

/* GLOBAL FIX (CLICKABLE BUTTON) */
openBtn.addEventListener("click", openModal);
closeBtn.addEventListener("click", closeModal);

window.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

/* =========================
   PHOTO PREVIEW
========================= */
photoInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    photoPreview.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

/* =========================
   SAVE MEMBER
========================= */
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;
  const nid = document.getElementById("nid").value;
  const photo = photoInput.files[0];

  if (!photo) return alert("Select photo");

  const storageRef = ref(storage, "members/" + Date.now());
  await uploadBytes(storageRef, photo);
  const photoUrl = await getDownloadURL(storageRef);

  await addDoc(collection(db, "members"), {
    name,
    phone,
    nid,
    photoUrl,
    status: "active",
    createdAt: serverTimestamp()
  });

  alert("Member saved");

  form.reset();
  photoPreview.src = "https://dummyimage.com/120x120";

  closeModal();
  loadMembers();
});

/* =========================
   LOAD MEMBERS
========================= */
async function loadMembers() {
  table.innerHTML = "";

  const snap = await getDocs(collection(db, "members"));

  snap.forEach((doc) => {
    const m = doc.data();

    table.innerHTML += `
      <tr>
        <td><img src="${m.photoUrl}" width="40" height="40" style="border-radius:50%"></td>
        <td>${m.name}</td>
        <td>${m.phone}</td>
        <td>${m.nid}</td>
        <td>${m.status}</td>
      </tr>
    `;
  });
}

loadMembers();
