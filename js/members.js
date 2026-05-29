import { db, auth } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================================================
   ELEMENTS
========================================================= */

const memberForm =
  document.getElementById("memberForm");

const membersTable =
  document.getElementById("membersTable");

const totalMembers =
  document.getElementById("totalMembers");

const searchInput =
  document.getElementById("searchInput");

/* =========================================================
   GLOBAL
========================================================= */

let members = [];

let editingId = null;

/* =========================================================
   LOAD MEMBERS
========================================================= */

async function loadMembers() {

  try {

    membersTable.innerHTML = `
      <tr>
        <td colspan="9">
          Loading...
        </td>
      </tr>
    `;

    const q = query(
      collection(db, "members"),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);

    members = [];

    membersTable.innerHTML = "";

    if (snap.empty) {

      membersTable.innerHTML = `
        <tr>
          <td colspan="9">
            No members found
          </td>
        </tr>
      `;

      totalMembers.innerText = "0";

      return;

    }

    snap.forEach((docSnap) => {

      const data = docSnap.data();

      members.push({
        id: docSnap.id,
        ...data
      });

    });

    renderMembers(members);

  } catch (error) {

    console.error(error);

    alert(error.message);

  }

}

/* =========================================================
   RENDER MEMBERS
========================================================= */

function renderMembers(data) {

  membersTable.innerHTML = "";

  totalMembers.innerText = data.length;

  data.forEach((member) => {

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${member.fullName || "-"}</td>
      
      <td>${member.gender || "-"}</td>
     
      <td>${member.memberId || "-"}</td>

      <td>${member.phone || "-"}</td>

      <td>${member.address || "-"}</td>

      <td>
        <span class="status active">
          ${member.status || "Active"}
        </span>
      </td>

      <td>${member.createdBy || "-"}</td>

      <td>
        ${
          member.createdAt?.toDate
          ? member.createdAt.toDate().toLocaleString()
          : "-"
        }
      </td>

      <td>

        <button
          class="edit-btn"
          onclick="editMember('${member.id}')"
        >
          ✏️
        </button>

        <button
          class="delete-btn"
          onclick="deleteMember('${member.id}')"
        >
          🗑️
        </button>

      </td>
    `;

    membersTable.appendChild(tr);

  });

}

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
   CHECK DUPLICATE
========================================================= */

async function checkDuplicate(
  memberId,
  phone,
  currentId = null
) {

  const nidQuery = query(
    collection(db, "members"),
    where("memberId", "==", memberId)
  );

  const phoneQuery = query(
    collection(db, "members"),
    where("phone", "==", phone)
  );

  const [nidSnap, phoneSnap] =
    await Promise.all([
      getDocs(nidQuery),
      getDocs(phoneQuery)
    ]);

  let duplicate = false;

  nidSnap.forEach((docSnap) => {

    if (docSnap.id !== currentId) {
      duplicate = true;
    }

  });

  phoneSnap.forEach((docSnap) => {

    if (docSnap.id !== currentId) {
      duplicate = true;
    }

  });

  return duplicate;

}

/* =========================================================
   ADD / UPDATE MEMBER
========================================================= */

memberForm.addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();

    try {

      const memberId =
        document
        .getElementById("memberId")
        .value
        .trim();

      const fullName =
        document
        .getElementById("fullName")
        .value
        .trim();

      const gender =
        document
        .getElementById("gender")
        .value;

      const phone =
        document
        .getElementById("phone")
        .value
        .trim();

      const address =
        document
        .getElementById("address")
        .value
        .trim();

      /* VALIDATION */

      if (!validateNID(memberId)) {

        alert(
          "NID must be exactly 16 digits"
        );

        return;

      }

      if (!validatePhone(phone)) {

        alert(
          "Phone number must be exactly 9 digits"
        );

        return;

      }

      /* DUPLICATE CHECK */

      const duplicate =
        await checkDuplicate(
          memberId,
          phone,
          editingId
        );

      if (duplicate) {

        alert(
          "Member already exists"
        );

        return;

      }

      /* DATA */

      const payload = {

        memberId,
        fullName,
        gender,
        phone,
        address,

        status: "Active",

        createdBy:
          localStorage.getItem("name") ||
          auth.currentUser?.displayName ||
          "Admin"

      };

      /* UPDATE */

      if (editingId) {

        await updateDoc(
          doc(db, "members", editingId),
          payload
        );

        alert("Member updated");

        editingId = null;

      }

      /* ADD */

      else {

        payload.createdAt =
          serverTimestamp();

        await addDoc(
          collection(db, "members"),
          payload
        );

        alert("Member added");

      }

      memberForm.reset();

      loadMembers();

    } catch (error) {

      console.error(error);

      alert(error.message);

    }

  }
);

/* =========================================================
   EDIT MEMBER
========================================================= */

window.editMember = function(id) {

  const member =
    members.find((m) => m.id === id);

  if (!member) return;

  editingId = id;

  document.getElementById("memberId")
  .value =
    member.memberId || "";

  document.getElementById("fullName")
  .value =
    member.fullName || "";

  document.getElementById("gender")
  .value =
    member.gender || "Male";

  document.getElementById("phone")
  .value =
    member.phone || "";

  document.getElementById("address")
  .value =
    member.address || "";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

};

/* =========================================================
   DELETE MEMBER
========================================================= */

window.deleteMember =
  async function(id) {

    const confirmDelete =
      confirm(
        "Delete this member?"
      );

    if (!confirmDelete) return;

    try {

      await deleteDoc(
        doc(db, "members", id)
      );

      loadMembers();

    } catch (error) {

      console.error(error);

      alert(error.message);

    }

  };

/* =========================================================
   SEARCH
========================================================= */

window.searchMembers = function() {

  const value =
    searchInput.value
    .toLowerCase()
    .trim();

  const filtered =
    members.filter((member) => {

      return (

        member.fullName
        ?.toLowerCase()
        .includes(value)

        ||

        member.phone
        ?.includes(value)

        ||

        member.memberId
        ?.includes(value)

      );

    });

  renderMembers(filtered);

};

/* =========================================================
   EXPORT CSV
========================================================= */

window.exportMembersCSV =
  function() {

    let csv =
      "NID,Full Name,Gender,Phone,Address,Status\n";

    members.forEach((member) => {

      csv += `
${member.memberId},
${member.fullName},
${member.gender},
${member.phone},
${member.address},
${member.status}
`;

    });

    const blob =
      new Blob([csv], {
        type: "text/csv"
      });

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;

    a.download =
      "members.csv";

    a.click();

  };

/* =========================================================
   LOAD
========================================================= */

loadMembers();
