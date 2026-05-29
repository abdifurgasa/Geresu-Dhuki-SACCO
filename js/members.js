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
  updateDoc,
  deleteDoc,
  doc
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

const historyTable =
  document.getElementById("historyTable");

const searchInput =
  document.getElementById("searchInput");

/* =========================================================
   GLOBAL STATE
========================================================= */

let members = [];

let lastVisible = null;

let isLoadingMembers = false;

let editingMemberId = null;

/* =========================================================
   MODAL OPEN/CLOSE
========================================================= */

openModalBtn?.addEventListener("click", () => {

  modal.style.display = "flex";

});

closeModalBtn?.addEventListener("click", () => {

  modal.style.display = "none";

});

closeProfileBtn?.addEventListener("click", () => {

  profileModal.style.display = "none";

});

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

async function checkDuplicate(phone, nid, excludeId = null) {

  const phoneQ = query(
    collection(db, "members"),
    where("phone", "==", phone)
  );

  const nidQ = query(
    collection(db, "members"),
    where("nid", "==", nid)
  );

  const [phoneSnap, nidSnap] =
    await Promise.all([
      getDocs(phoneQ),
      getDocs(nidQ)
    ]);

  let duplicate = false;

  phoneSnap.forEach(docSnap => {

    if (docSnap.id !== excludeId) {

      duplicate = true;

    }

  });

  nidSnap.forEach(docSnap => {

    if (docSnap.id !== excludeId) {

      duplicate = true;

    }

  });

  return duplicate;

}

/* =========================================================
   ADD / UPDATE MEMBER
========================================================= */

memberForm?.addEventListener("submit", async (e) => {

  e.preventDefault();

  try {

    const lang =
      localStorage.getItem("language") || "en";

    const name =
      document.getElementById("name")
      .value.trim();

    const phone =
      document.getElementById("phone")
      .value.trim();

    const nid =
      document.getElementById("nid")
      .value.trim();

    /* PHONE VALIDATION */

    if (!validatePhone(phone)) {

      alert(
        translations[lang]?.phoneError ||
        "Phone must be exactly 9 digits"
      );

      return;

    }

    /* NID VALIDATION */

    if (!validateNID(nid)) {

      alert(
        translations[lang]?.nidError ||
        "NID must be exactly 16 digits"
      );

      return;

    }

    /* DUPLICATE CHECK */

    const duplicate =
      await checkDuplicate(
        phone,
        nid,
        editingMemberId
      );

    if (duplicate) {

      alert(
        translations[lang]?.duplicateError ||
        "Duplicate Phone or NID detected"
      );

      return;

    }

    /* UPDATE */

    if (editingMemberId) {

      await updateDoc(
        doc(db, "members", editingMemberId),
        {
          name,
          phone,
          nid
        }
      );

      editingMemberId = null;

    }

    /* ADD */

    else {

      await addDoc(
        collection(db, "members"),
        {
          name,
          phone,
          nid,
          status: "Active",
          createdAt: serverTimestamp(),
          createdBy:
            localStorage.getItem("name") ||
            auth.currentUser?.displayName ||
            "Admin"
        }
      );

    }

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

  if (isLoadingMembers) return;

  isLoadingMembers = true;

  try {

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

      isLoadingMembers = false;

      return;

    }

    lastVisible =
      snap.docs[snap.docs.length - 1];

    for (const docSnap of snap.docs) {

      const m = docSnap.data();

      const id = docSnap.id;

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

      const remainingLoan =
        totalLoans - totalRepayments;

      const member = {

        id,

        ...m,

        totalSavings,

        totalLoans,

        remainingLoan

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

        <td>${member.remainingLoan}</td>

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

        openProfile(member.id);

      });

      membersTable.appendChild(tr);

    }

  }

  catch (err) {

    console.error(err);

  }

  isLoadingMembers = false;

}

/* =========================================================
   SEARCH MEMBERS
========================================================= */

searchInput?.addEventListener("input", () => {

  const value =
    searchInput.value.toLowerCase();

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
   OPEN PROFILE
========================================================= */

async function openProfile(memberId) {

  const member =
    members.find(m => m.id === memberId);

  if (!member) return;

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
    member.remainingLoan;

  document.getElementById("profileInitial")
  .innerText =
    member.name.charAt(0).toUpperCase();

  document.getElementById("profileStatus")
  .innerText =
    member.status;

  historyTable.innerHTML = "";

  /* LOAD TRANSACTIONS */

  const txQ = query(
    collection(db, "transactions"),
    where("memberId", "==", memberId),
    orderBy("createdAt", "desc")
  );

  const txSnap = await getDocs(txQ);

  txSnap.forEach(docSnap => {

    const tx = docSnap.data();

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
   EDIT MEMBER
========================================================= */

window.editMember = (id) => {

  const member =
    members.find(m => m.id === id);

  if (!member) return;

  editingMemberId = id;

  document.getElementById("name")
  .value =
    member.name;

  document.getElementById("phone")
  .value =
    member.phone;

  document.getElementById("nid")
  .value =
    member.nid;

  modal.style.display = "flex";

};

/* =========================================================
   DELETE MEMBER
========================================================= */

window.deleteMember = async (id) => {

  const confirmDelete =
    confirm("Delete member?");

  if (!confirmDelete) return;

  try {

    await deleteDoc(
      doc(db, "members", id)
    );

    loadMembers(true);

  }

  catch (err) {

    console.error(err);

  }

};

/* =========================================================
   INIT
========================================================= */

loadMembers();
