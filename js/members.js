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
   🔥 FIX: MAKE SURE ELEMENTS EXIST
========================= */
console.log("Open Button:", openBtn);
console.log("Modal:", modal);

/* =========================
   MODAL OPEN / CLOSE (FIXED)
========================= */
function openModal() {
  modal.style.display = "flex";
}

function closeModal() {
  modal.style.display = "none";
}

/* IMPORTANT: attach events safely */
if (openBtn) {
  openBtn.addEventListener("click", (e) => {
    e.preventDefault();
    openModal();
  });
}

if (closeBtn) {
  closeBtn.addEventListener("click", closeModal);
}

/* close when clicking outside modal */
window.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

/* =========================
   PHOTO PREVIEW
========================= */
if (photoInput) {
  photoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      photoPreview.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/* =========================
   SAVE MEMBER
========================= */
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const name = document.getElementById("name").value.trim();
      const phone = document.getElementById("phone").value.trim();
      const nid = document.getElementById("nid").value.trim();
      const photo = photoInput.files[0];

      if (!photo) return alert("Select photo");

      if (phone.length !== 9) return alert("Phone must be 9 digits");
      if (nid.length !== 16) return alert("NID must be 16 digits");

      /* UPLOAD PHOTO */
      const fileName = Date.now() + "_" + photo.name;
      const storageRef = ref(storage, "members/" + fileName);

      await uploadBytes(storageRef, photo);
      const photoUrl = await getDownloadURL(storageRef);

      /* SAVE FIRESTORE */
      await addDoc(collection(db, "members"), {
        name,
        phone,
        nid,
        photoUrl,
        savings: 0,
        loanTotal: 0,
        loanRemaining: 0,
        status: "active",
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.email || "admin"
      });

      alert("Member saved");

      form.reset();
      photoPreview.src = "https://dummyimage.com/120x120";

      closeModal();
      loadMembers();

    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  });
}

/* =========================
   LOAD MEMBERS
========================= */
async function loadMembers() {
  if (!table) return;

  table.innerHTML = "";

  const snap = await getDocs(collection(db, "members"));

  snap.forEach((doc) => {
    const m = doc.data();

    table.innerHTML += `
      <tr>
        <td><img src="${m.photoUrl}" class="member-photo"></td>
        <td>${m.name}</td>
        <td>${m.phone}</td>
        <td>${m.nid}</td>
        <td>${m.savings}</td>
        <td>${m.loanTotal}</td>
        <td>${m.loanRemaining}</td>
        <td>${m.status}</td>
        <td>-</td>
        <td>${m.createdBy}</td>
      </tr>
    `;
  });
}

loadMembers();
