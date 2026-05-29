import { db, auth } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================================================
   ELEMENTS
========================================================= */

const memberModal =
  document.getElementById("memberModal");

const openModalBtn =
  document.getElementById("openModalBtn");

const closeModalBtn =
  document.getElementById("closeModalBtn");

const memberForm =
  document.getElementById("memberForm");

const membersTable =
  document.getElementById("membersTable");

/* =========================================================
   OPEN MODAL
========================================================= */

openModalBtn?.addEventListener("click", () => {

  memberModal.classList.add("active");

});

/* =========================================================
   CLOSE MODAL
========================================================= */

closeModalBtn?.addEventListener("click", () => {

  memberModal.classList.remove("active");

});

/* =========================================================
   CLOSE OUTSIDE
========================================================= */

window.addEventListener("click", (e) => {

  if (e.target === memberModal) {

    memberModal.classList.remove("active");

  }

});

/* =========================================================
   VALIDATION
========================================================= */

function validatePhone(phone){

  return /^[0-9]{9}$/.test(phone);

}

function validateNID(nid){

  return /^[0-9]{16}$/.test(nid);

}

/* =========================================================
   DUPLICATE CHECK
========================================================= */

async function checkDuplicate(phone, nid){

  const phoneQuery = query(
    collection(db, "members"),
    where("phone", "==", phone)
  );

  const nidQuery = query(
    collection(db, "members"),
    where("nid", "==", nid)
  );

  const [phoneSnap, nidSnap] = await Promise.all([
    getDocs(phoneQuery),
    getDocs(nidQuery)
  ]);

  return !phoneSnap.empty || !nidSnap.empty;

}

/* =========================================================
   ADD MEMBER
========================================================= */

memberForm?.addEventListener("submit", async (e) => {

  e.preventDefault();

  try{

    const name =
      document.getElementById("name")
      .value
      .trim();

    const phone =
      document.getElementById("phone")
      .value
      .trim();

    const nid =
      document.getElementById("nid")
      .value
      .trim();

    /* PHONE VALIDATION */

    if(!validatePhone(phone)){

      alert(
        "Phone number must be exactly 9 digits"
      );

      return;

    }

    /* NID VALIDATION */

    if(!validateNID(nid)){

      alert(
        "NID must be exactly 16 digits"
      );

      return;

    }

    /* DUPLICATE CHECK */

    const exists =
      await checkDuplicate(phone, nid);

    if(exists){

      alert(
        "Duplicate phone or NID detected"
      );

      return;

    }

    /* SAVE */

    await addDoc(
      collection(db, "members"),
      {

        name,
        phone,
        nid,

        status:"Active",

        createdAt:
          serverTimestamp(),

        createdBy:
          localStorage.getItem("name") ||
          auth.currentUser?.displayName ||
          "Admin"

      }
    );

    alert("Member added successfully");

    memberForm.reset();

    memberModal.classList.remove("active");

    loadMembers();

  }catch(err){

    console.error(err);

    alert(err.message);

  }

});

/* =========================================================
   LOAD MEMBERS
========================================================= */

async function loadMembers(){

  try{

    membersTable.innerHTML = "";

    const q = query(
      collection(db, "members")
    );

    const snap = await getDocs(q);

    snap.forEach((docSnap) => {

      const member = docSnap.data();

      membersTable.innerHTML += `
        <tr>
          <td>${member.name}</td>
          <td>${member.phone}</td>
          <td>${member.nid}</td>
          <td>${member.status}</td>
          <td>
            ${
              member.createdAt?.toDate?.()
              ?.toLocaleString() || "-"
            }
          </td>
          <td>${member.createdBy || "-"}</td>
        </tr>
      `;

    });

  }catch(err){

    console.error(err);

  }

}

/* =========================================================
   INIT
========================================================= */

loadMembers();
