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
const memberForm = document.getElementById("memberForm");
const membersTable = document.getElementById("membersTable");

const searchInput = document.getElementById("searchMember");
const searchResults = document.getElementById("searchResults");
const selectedMember = document.getElementById("selectedMember");

const photoInput = document.getElementById("photo");
const photoPreview = document.getElementById("photoPreview");

const modal = document.getElementById("memberModal");
const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

/* =========================
   MODAL FIX
========================= */
function openModal() {
  modal.style.display = "flex";
}

function closeModal() {
  modal.style.display = "none";
}

if (openModalBtn) {
  openModalBtn.addEventListener("click", openModal);
}

if (closeModalBtn) {
  closeModalBtn.addEventListener("click", closeModal);
}

window.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

/* =========================
   IMAGE PREVIEW
========================= */
if (photoInput) {
  photoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      photoPreview.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/* =========================
   IMAGE COMPRESSION FIX
========================= */
function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;

      img.onload = () => {
        const canvas = document.createElement("canvas");

        const maxWidth = 800;
        const scale = maxWidth / img.width;

        canvas.width = maxWidth;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          resolve(blob);
        }, "image/jpeg", 0.7);
      };
    };

    reader.readAsDataURL(file);
  });
}

/* =========================
   SAVE MEMBER
========================= */
if (memberForm) {
  memberForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const name = document.getElementById("name").value.trim();
      const phone = document.getElementById("phone").value.trim();
      const nid = document.getElementById("nid").value.trim();
      const photo = photoInput.files[0];

      if (!photo) return alert("Select photo");
      if (phone.length !== 9) return alert("Phone must be 9 digits");
      if (nid.length !== 16) return alert("NID must be 16 digits");

      // duplicate check
      const phoneSnap = await getDocs(query(collection(db, "members"), where("phone", "==", phone)));
      if (!phoneSnap.empty) return alert("Phone already exists");

      const nidSnap = await getDocs(query(collection(db, "members"), where("nid", "==", nid)));
      if (!nidSnap.empty) return alert("NID already exists");

      // compress image (IMPORTANT FIX)
      const compressedPhoto = await compressImage(photo);

      const fileName = Date.now() + ".jpg";
      const storageRef = ref(storage, "members/" + fileName);

      await uploadBytes(storageRef, compressedPhoto, {
        contentType: "image/jpeg"
      });

      const photoUrl = await getDownloadURL(storageRef);

      const user = auth.currentUser;

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
        createdBy: user ? user.email : "admin"
      });

      alert("✅ Member saved successfully");

      memberForm.reset();
      photoPreview.src =
        "https://dummyimage.com/120x120/cccccc/000000&text=Photo";

      closeModal();
      loadMembers();

    } catch (error) {
      console.error(error);
      alert("❌ Error: " + error.message);
    }
  });
}

/* =========================
   LOAD MEMBERS
========================= */
async function loadMembers() {
  if (!membersTable) return;

  membersTable.innerHTML = "";

  const snapshot = await getDocs(collection(db, "members"));

  snapshot.forEach((doc) => {
    const m = doc.data();

    membersTable.innerHTML += `
      <tr>
        <td><img src="${m.photoUrl}" class="member-photo"></td>
        <td>${m.name}</td>
        <td>${m.phone}</td>
        <td>${m.nid}</td>
        <td>${m.savings}</td>
        <td>${m.loanTotal}</td>
        <td>${m.loanRemaining}</td>
        <td>${m.status}</td>
        <td>${m.createdBy}</td>
      </tr>
    `;
  });
}

loadMembers();
