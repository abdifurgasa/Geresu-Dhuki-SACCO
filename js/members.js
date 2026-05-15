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
   CHECK IMPORTANT ELEMENTS
========================= */
console.log("Modal:", modal);
console.log("Open button:", openModalBtn);

/* =========================
   MODAL OPEN/CLOSE
========================= */

function openModal() {
  modal.style.display = "flex";
}

function closeModal() {
  modal.style.display = "none";
}

/* BUTTON EVENTS */
if (openModalBtn) {
  openModalBtn.addEventListener("click", openModal);
}

if (closeModalBtn) {
  closeModalBtn.addEventListener("click", closeModal);
}

/* CLOSE OUTSIDE */
window.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

/* =========================
   PHOTO PREVIEW
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
   SAVE MEMBER
========================= */
if (memberForm) {

  memberForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    try {

      const name =
        document.getElementById("name").value.trim();

      const phone =
        document.getElementById("phone").value.trim();

      const nid =
        document.getElementById("nid").value.trim();

      const photo =
        photoInput.files[0];

      if (!photo) {
        alert("Please select photo");
        return;
      }

      if (phone.length !== 9) {
        alert("Phone must be 9 digits");
        return;
      }

      if (nid.length !== 16) {
        alert("NID must be 16 digits");
        return;
      }

      /* DUPLICATE PHONE */
      const phoneSnap = await getDocs(
        query(
          collection(db, "members"),
          where("phone", "==", phone)
        )
      );

      if (!phoneSnap.empty) {
        alert("Phone already exists");
        return;
      }

      /* DUPLICATE NID */
      const nidSnap = await getDocs(
        query(
          collection(db, "members"),
          where("nid", "==", nid)
        )
      );

      if (!nidSnap.empty) {
        alert("NID already exists");
        return;
      }

      /* STORAGE */
      const fileName =
        Date.now() + "_" + photo.name;

      const storageRef =
        ref(storage, "members/" + fileName);

      /* UPLOAD */
      await uploadBytes(storageRef, photo);

      /* URL */
      const photoUrl =
        await getDownloadURL(storageRef);

      /* CURRENT USER */
      const user = auth.currentUser;

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

        createdBy:
          user ? user.email : "admin"

      });

      alert("✅ Member saved successfully");

      memberForm.reset();

      photoPreview.src =
        "https://dummyimage.com/120x120/cccccc/000000&text=Photo";

      closeModal();

      loadMembers();

    } catch (error) {

      console.error(error);

      alert(
        "❌ Error: " + error.message
      );

    }

  });

}

/* =========================
   LOAD MEMBERS
========================= */
async function loadMembers() {

  if (!membersTable) return;

  membersTable.innerHTML = "";

  try {

    const snapshot =
      await getDocs(collection(db, "members"));

    snapshot.forEach((doc) => {

      const m = doc.data();

      membersTable.innerHTML += `

        <tr>

          <td>
            <img
              src="${m.photoUrl}"
              class="member-photo"
            >
          </td>

          <td>${m.name}</td>

          <td>${m.phone}</td>

          <td>${m.nid}</td>

          <td>${m.savings}</td>

          <td>${m.loanTotal}</td>

          <td>${m.loanRemaining}</td>

          <td>${m.status}</td>

          <td>
            ${
              m.createdAt
              ? new Date(
                  m.createdAt.seconds * 1000
                ).toLocaleDateString()
              : "-"
            }
          </td>

          <td>${m.createdBy}</td>

        </tr>

      `;

    });

  } catch (error) {

    console.error(error);

  }

}

loadMembers();

/* =========================
   SEARCH
========================= */
if (searchInput) {

  searchInput.addEventListener("input", async () => {

    const val =
      searchInput.value.toLowerCase();

    searchResults.innerHTML = "";

    if (!val) return;

    const snapshot =
      await getDocs(collection(db, "members"));

    snapshot.forEach((doc) => {

      const m = doc.data();

      if (

        m.name.toLowerCase().includes(val)

        ||

        m.phone.includes(val)

        ||

        m.nid.includes(val)

      ) {

        const div =
          document.createElement("div");

        div.className = "search-item";

        div.innerHTML = `
          <strong>${m.name}</strong>
          <small>${m.phone}</small>
        `;

        div.onclick = () => {

          selectedMember.innerHTML = `
            👤 ${m.name}<br>
            📱 ${m.phone}<br>
            🆔 ${m.nid}<br>
            💰 Savings: ${m.savings}
          `;

          searchResults.innerHTML = "";

        };

        searchResults.appendChild(div);

      }

    });

  });

}
