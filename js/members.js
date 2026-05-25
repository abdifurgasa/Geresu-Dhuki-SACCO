import { db, auth } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================
   ELEMENTS
========================= */

const memberForm = document.getElementById("memberForm");
const membersTable = document.getElementById("membersTable");

const modal = document.getElementById("memberModal");
const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtns = document.querySelectorAll("#closeModalBtn");

/* =========================
   MODAL OPEN
========================= */

if (openModalBtn) {
  openModalBtn.addEventListener("click", () => {
    modal.style.display = "flex";
  });
}

/* =========================
   MODAL CLOSE (MULTI BUTTON FIX)
========================= */

closeModalBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    modal.style.display = "none";
  });
});

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

      /* VALIDATION */
      if (!name || name.length < 2) {
        alert("Enter valid name");
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

      /* CHECK DUPLICATE PHONE */
      const phoneCheck = await getDocs(
        query(collection(db, "members"), where("phone", "==", phone))
      );

      if (!phoneCheck.empty) {
        alert("Phone already exists");
        return;
      }

      /* CHECK DUPLICATE NID */
      const nidCheck = await getDocs(
        query(collection(db, "members"), where("nid", "==", nid))
      );

      if (!nidCheck.empty) {
        alert("NID already exists");
        return;
      }

      /* USER NAME ONLY */
      const user = auth.currentUser;

      const createdBy = user?.displayName || "Unknown";

      /* SAVE TO FIRESTORE */
      await addDoc(collection(db, "members"), {

        name,
        phone,
        nid,

        savings: 0,
        loanTotal: 0,
        loanRemaining: 0,

        status: "active",

        createdAt: serverTimestamp(),
        createdBy

      });

      alert("Member added successfully");

      memberForm.reset();
      modal.style.display = "none";

      loadMembers();

    } catch (error) {
      console.error(error);
      alert("Error: " + error.message);
    }
  });
}

/* =========================
   LOAD MEMBERS TABLE
========================= */

async function loadMembers() {

  if (!membersTable) return;

  membersTable.innerHTML = "";

  const snap = await getDocs(collection(db, "members"));

  snap.forEach(doc => {

    const m = doc.data();

    membersTable.innerHTML += `
      <tr>
        <td>${m.name || "-"}</td>
        <td>${m.phone || "-"}</td>
        <td>${m.nid || "-"}</td>
        <td>${m.savings ?? 0}</td>
        <td>${m.loanTotal ?? 0}</td>
        <td>${m.loanRemaining ?? 0}</td>
        <td>${m.status || "active"}</td>
        <td>
          ${
            m.createdAt
              ? new Date(m.createdAt.seconds * 1000).toLocaleDateString()
              : "-"
          }
        </td>
        <td>${m.createdBy || "Unknown"}</td>
      </tr>
    `;
  });
}

/* INIT */
loadMembers();
