```javascript
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
  limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================================================
   LANGUAGE
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

const historyTable =
  document.getElementById("historyTable");

const searchInput =
  document.getElementById("searchInput");

/* =========================================================
   GLOBAL
========================================================= */

let members = [];

/* =========================================================
   OPEN MODAL
========================================================= */

openModalBtn?.addEventListener("click", () => {

  modal.style.display = "flex";

});

/* =========================================================
   CLOSE MODAL
========================================================= */

closeModalBtn?.addEventListener("click", () => {

  modal.style.display = "none";

});

/* =========================================================
   CLOSE PROFILE
========================================================= */

closeProfileBtn?.addEventListener("click", () => {

  profileModal.style.display = "none";

});

/* =========================================================
   CLOSE OUTSIDE
========================================================= */

window.addEventListener("click", (e) => {

  if (e.target === modal) {

    modal.style.display = "none";

  }

  if (e.target === profileModal) {

    profileModal.style.display = "none";

  }

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

  const phoneQuery = query(
    collection(db, "members"),
    where("phone", "==", phone)
  );

  const nidQuery = query(
    collection(db, "members"),
    where("nid", "==", nid)
  );

  const [phoneSnap, nidSnap] =
    await Promise.all([
      getDocs(phoneQuery),
      getDocs(nidQuery)
    ]);

  return (
    !phoneSnap.empty ||
    !nidSnap.empty
  );

}

/* =========================================================
   ADD MEMBER
========================================================= */

memberForm?.addEventListener("submit", async (e) => {

  e.preventDefault();

  try {

    const lang =
      localStorage.getItem("language") || "en";

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

    /* PHONE */

    if (!validatePhone(phone)) {

      alert(
        translations[lang]?.phoneError ||
        "Phone must be exactly 9 digits"
      );

      return;

    }

    /* NID */

    if (!validateNID(nid)) {

      alert(
        translations[lang]?.nidError ||
        "NID must be exactly 16 digits"
      );

      return;

    }

    /* DUPLICATE */

    const duplicate =
      await checkDuplicate(phone, nid);

    if (duplicate) {

      alert(
        translations[lang]?.duplicateError ||
        "Duplicate phone or NID"
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
        status: "Active",

        createdAt:
          serverTimestamp(),

        createdBy:
          localStorage.getItem("name") ||
          auth.currentUser?.displayName ||
          "Admin"
      }
    );

    memberForm.reset();

    modal.style.display = "none";

    loadMembers(true);

  }

  catch (err) {

    console.error(err);

    alert(err.message);

  }

});

/* =========================================================
   LOAD MEMBERS
========================================================= */

async function loadMembers(reset = false) {

  try {

    if (reset) {

      members = [];

      membersTable.innerHTML = "";

    }

    const q = query(
      collection(db, "members"),
      orderBy("createdAt", "desc"),
      limit(100)
    );

    const snap =
      await getDocs(q);

    membersTable.innerHTML = "";

    members = [];

    for (const docSnap of snap.docs) {

      const m =
        docSnap.data();

      const id =
        docSnap.id;

      /* SAVINGS */

      const savingsSnap =
        await getDocs(
          query(
            collection(db, "savings"),
            where("memberId", "==", id)
          )
        );

      let totalSavings = 0;

      savingsSnap.forEach(d => {

        totalSavings +=
          Number(d.data().amount || 0);

      });

      /* LOANS */

      const loansSnap =
        await getDocs(
          query(
            collection(db, "loans"),
            where("memberId", "==", id)
          )
        );

      let totalLoans = 0;

      loansSnap.forEach(d => {

        totalLoans +=
          Number(d.data().total || 0);

      });

      /* REPAYMENTS */

      const repaymentsSnap =
        await getDocs(
          query(
            collection(db, "repayments"),
            where("memberId", "==", id)
          )
        );

      let totalRepayments = 0;

      repaymentsSnap.forEach(d => {

        totalRepayments +=
          Number(d.data().amount || 0);

      });

      const member = {

        id,

        ...m,

        totalSavings,

        totalLoans,

        remaining:
          totalLoans -
          totalRepayments

      };

      members.push(member);

      const tr =
        document.createElement("tr");

      tr.innerHTML = `
        <td>
          <strong>${member.name}</strong>
        </td>

        <td>${member.phone}</td>

        <td>${member.nid}</td>

        <td>${member.totalSavings}</td>

        <td>${member.totalLoans}</td>

        <td>${member.remaining}</td>

        <td>${member.status}</td>

        <td>
          ${
            member.createdAt?.toDate?.()
            ?.toLocaleString() || "-"
          }
        </td>

        <td>
          ${member.createdBy || "-"}
        </td>
      `;

      tr.style.cursor = "pointer";

      tr.addEventListener("click", () => {

        openProfile(member);

      });

      membersTable.appendChild(tr);

    }

  }

  catch (err) {

    console.error(err);

  }

}

/* =========================================================
   OPEN PROFILE
========================================================= */

async function openProfile(member) {

  profileModal.style.display = "flex";

  document.getElementById("profileTitle")
  .innerText =
    member.name;

  document.getElementById("profilePhone")
  .innerText =
    member.phone;

  document.getElementById("profileNid")
  .innerText =
    member.nid;

  document.getElementById("profileSavings")
  .innerText =
    member.totalSavings;

  document.getElementById("profileLoans")
  .innerText =
    member.totalLoans;

  document.getElementById("profileRemaining")
  .innerText =
    member.remaining;

  document.getElementById("profileInitial")
  .innerText =
    member.name
    .charAt(0)
    .toUpperCase();

  document.getElementById("profileStatus")
  .innerText =
    member.status;

  historyTable.innerHTML = "";

  const txQuery = query(
    collection(db, "transactions"),
    where("memberId", "==", member.id),
    orderBy("createdAt", "desc")
  );

  const txSnap =
    await getDocs(txQuery);

  txSnap.forEach(doc => {

    const tx =
      doc.data();

    historyTable.innerHTML += `
      <tr>

        <td>${tx.type || "-"}</td>

        <td>${tx.amount || 0}</td>

        <td>${tx.previous || 0}</td>

        <td>${tx.total || 0}</td>

        <td>${tx.status || "-"}</td>

        <td>
          ${
            tx.createdAt?.toDate?.()
            ?.toLocaleString() || "-"
          }
        </td>

        <td>${tx.createdBy || "-"}</td>

      </tr>
    `;

  });

}

/* =========================================================
   SEARCH
========================================================= */

searchInput?.addEventListener("keyup", () => {

  const value =
    searchInput.value
    .toLowerCase();

  const rows =
    membersTable.querySelectorAll("tr");

  rows.forEach(row => {

    if (
      row.innerText
      .toLowerCase()
      .includes(value)
    ) {

      row.style.display = "";

    }

    else {

      row.style.display = "none";

    }

  });

});

/* =========================================================
   INIT
========================================================= */

loadMembers();
```
