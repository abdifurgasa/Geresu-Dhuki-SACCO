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

const savingForm =
  document.getElementById("savingForm");

const savingsTable =
  document.getElementById("savingsTable");

const totalSavings =
  document.getElementById("totalSavings");

const searchInput =
  document.getElementById("searchInput");

const exportBtn =
  document.getElementById("exportBtn");

const logoutBtn =
  document.getElementById("logoutBtn");

const profileModal =
  document.getElementById("profileModal");

const closeProfileBtn =
  document.getElementById("closeProfileBtn");

/* =========================================================
   GLOBAL
========================================================= */

let savings = [];

let members = [];

let editingId = null;

let selectedMember = null;

/* =========================================================
   SIDEBAR TOGGLE
========================================================= */

window.toggleSidebar = function () {

  const sidebar =
    document.getElementById("sidebar");

  sidebar.classList.toggle("collapsed");

};

/* =========================================================
   LOGOUT
========================================================= */

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async (e) => {

      e.preventDefault();

      try {

        await auth.signOut();

        localStorage.clear();

        window.location.href =
          "index.html";

      } catch (error) {

        console.error(error);

        alert(error.message);

      }

    }
  );

}

/* =========================================================
   LOAD MEMBERS
========================================================= */

async function loadMembers() {

  try {

    const q = query(
      collection(db, "members"),
      orderBy("fullName")
    );

    const snap =
      await getDocs(q);

    members = [];

    snap.forEach((docSnap) => {

      members.push({
        id: docSnap.id,
        ...docSnap.data()
      });

    });

  } catch (error) {

    console.error(error);

  }

}

/* =========================================================
   SEARCH MEMBER
========================================================= */

window.searchMembers = function () {

  const value =
    searchInput.value
      .toLowerCase()
      .trim();

  const resultBox =
    document.getElementById(
      "searchResults"
    );

  resultBox.innerHTML = "";

  if (!value) {

    resultBox.style.display =
      "none";

    return;

  }

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

  if (!filtered.length) {

    resultBox.innerHTML = `
      <div class="search-item">
        No member found
      </div>
    `;

    resultBox.style.display =
      "block";

    return;

  }

  filtered.forEach((member) => {

    const div =
      document.createElement("div");

    div.className =
      "search-item";

    div.innerHTML = `
      <strong>
        ${member.fullName}
      </strong>
      <br>
      ${member.phone}
    `;

    div.onclick = () => {

      selectedMember = member;

      document.getElementById(
        "selectedMember"
      ).innerHTML = `
        👤 ${member.fullName}
      `;

      searchInput.value =
        member.fullName;

      resultBox.style.display =
        "none";

    };

    resultBox.appendChild(div);

  });

  resultBox.style.display =
    "block";

};

/* =========================================================
   LOAD SAVINGS
========================================================= */

async function loadSavings() {

  try {

    savingsTable.innerHTML = `
      <tr>
        <td colspan="8">
          Loading...
        </td>
      </tr>
    `;

    const q = query(
      collection(db, "savings"),
      orderBy("createdAt", "desc")
    );

    const snap =
      await getDocs(q);

    savings = [];

    if (snap.empty) {

      savingsTable.innerHTML = `
        <tr>
          <td colspan="8">
            No savings found
          </td>
        </tr>
      `;

      totalSavings.innerText = "0";

      return;

    }

    snap.forEach((docSnap) => {

      savings.push({
        id: docSnap.id,
        ...docSnap.data()
      });

    });

    renderSavings(savings);

  } catch (error) {

    console.error(error);

  }

}

/* =========================================================
   RENDER SAVINGS
========================================================= */

function renderSavings(data) {

  savingsTable.innerHTML = "";

  let total = 0;

  data.forEach((saving) => {

    total +=
      Number(saving.amount || 0);

    const tr =
      document.createElement("tr");

    tr.innerHTML = `
      <td>
        ${saving.memberName || "-"}
      </td>

      <td>
        ${saving.phone || "-"}
      </td>

      <td>
        ${saving.amount || 0}
      </td>

      <td>
        ${saving.method || "-"}
      </td>

      <td>
        <span class="status active">
          ${saving.status || "Completed"}
        </span>
      </td>

      <td>
        ${saving.createdBy || "-"}
      </td>

      <td>
        ${
          saving.createdAt?.toDate
            ? saving.createdAt
                .toDate()
                .toLocaleDateString()
            : "-"
        }
      </td>

      <td>

        <button
          class="edit-btn"
          onclick="editSaving('${saving.id}')"
        >
          ✏️
        </button>

        <button
          class="delete-btn"
          onclick="deleteSaving('${saving.id}')"
        >
          🗑️
        </button>

      </td>
    `;

    tr.addEventListener(
      "click",
      (e) => {

        if (
          e.target.closest(".edit-btn")
          ||
          e.target.closest(".delete-btn")
        ) {
          return;
        }

        openProfile(saving);

      }
    );

    savingsTable.appendChild(tr);

  });

  totalSavings.innerText =
    total.toLocaleString();

}

/* =========================================================
   ADD / UPDATE SAVING
========================================================= */

savingForm.addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();

    try {

      if (!selectedMember) {

        alert(
          "Please select member"
        );

        return;

      }

      const amount =
        document
          .getElementById("amount")
          .value
          .trim();

      const method =
        document
          .getElementById("method")
          .value;

      if (!amount || amount <= 0) {

        alert(
          "Enter valid amount"
        );

        return;

      }

      const payload = {

        memberId:
          selectedMember.memberId,

        memberName:
          selectedMember.fullName,

        phone:
          selectedMember.phone,

        amount:
          Number(amount),

        method,

        status: "Completed",

        createdBy:
          localStorage.getItem("name")
          ||
          auth.currentUser?.displayName
          ||
          "Admin"

      };

      /* UPDATE */

      if (editingId) {

        await updateDoc(
          doc(
            db,
            "savings",
            editingId
          ),
          payload
        );

        alert(
          "Saving updated"
        );

        editingId = null;

        savingForm.querySelector(
          "button"
        ).innerHTML = `
          <i class="fa fa-plus"></i>
          Add Saving
        `;

      }

      /* ADD */

      else {

        payload.createdAt =
          serverTimestamp();

        await addDoc(
          collection(db, "savings"),
          payload
        );

        alert(
          "Saving added"
        );

      }

      savingForm.reset();

      selectedMember = null;

      document.getElementById(
        "selectedMember"
      ).innerHTML =
        "👤 Select Member";

      loadSavings();

    } catch (error) {

      console.error(error);

      alert(error.message);

    }

  }
);

/* =========================================================
   EDIT SAVING
========================================================= */

window.editSaving = function (id) {

  const saving =
    savings.find(
      (s) => s.id === id
    );

  if (!saving) return;

  editingId = id;

  document.getElementById(
    "amount"
  ).value =
    saving.amount || "";

  document.getElementById(
    "method"
  ).value =
    saving.method || "Cash";

  selectedMember = {

    memberId:
      saving.memberId,

    fullName:
      saving.memberName,

    phone:
      saving.phone

  };

  document.getElementById(
    "selectedMember"
  ).innerHTML = `
    👤 ${saving.memberName}
  `;

  savingForm.querySelector(
    "button"
  ).innerHTML = `
    ✏️ Update Saving
  `;

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

};

/* =========================================================
   DELETE SAVING
========================================================= */

window.deleteSaving =
  async function (id) {

    const confirmDelete =
      confirm(
        "Delete this saving?"
      );

    if (!confirmDelete) return;

    try {

      await deleteDoc(
        doc(db, "savings", id)
      );

      loadSavings();

    } catch (error) {

      console.error(error);

      alert(error.message);

    }

  };

/* =========================================================
   PROFILE MODAL
========================================================= */

function openProfile(saving) {

  profileModal.classList.add(
    "active"
  );

  document.getElementById(
    "profileName"
  ).innerText =
    saving.memberName || "-";

  document.getElementById(
    "profilePhone"
  ).innerText =
    saving.phone || "-";

  document.getElementById(
    "profileAmount"
  ).innerText =
    saving.amount || "0";

  document.getElementById(
    "profileMethod"
  ).innerText =
    saving.method || "-";

  document.getElementById(
    "profileStatus"
  ).innerText =
    saving.status || "-";

}

/* CLOSE PROFILE */

if (closeProfileBtn) {

  closeProfileBtn.addEventListener(
    "click",
    () => {

      profileModal.classList.remove(
        "active"
      );

    }
  );

}

window.addEventListener(
  "click",
  (e) => {

    if (e.target === profileModal) {

      profileModal.classList.remove(
        "active"
      );

    }

  }
);

/* =========================================================
   EXPORT CSV
========================================================= */

if (exportBtn) {

  exportBtn.addEventListener(
    "click",
    () => {

      let csv =
        "Member,Phone,Amount,Method,Status\n";

      savings.forEach((saving) => {

        csv +=
`${saving.memberName},
${saving.phone},
${saving.amount},
${saving.method},
${saving.status}\n`;

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
        "savings.csv";

      a.click();

    }
  );

}

/* =========================================================
   LOAD
========================================================= */

loadMembers();

loadSavings();
