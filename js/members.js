```javascript
import { db, auth } from "./firebase.js";
import {
  translations,
  setLanguage,
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
  startAfter
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

/* PROFILE */

const profileModal =
  document.getElementById("profileModal");

const closeProfileBtn =
  document.getElementById("closeProfileBtn");

const historyTable =
  document.getElementById("historyTable");

const historyContainer =
  document.getElementById("historyContainer");

/* =========================================================
   GLOBAL STATE
========================================================= */

let members = [];

let lastVisible = null;

let isLoadingMembers = false;

/* TRANSACTIONS */

let transactionPageSize = 20;

let lastTransactionDoc = null;

let currentMemberId = null;

let loadingTransactions = false;

let hasMoreTransactions = true;

/* =========================================================
   INIT LANGUAGE
========================================================= */

initLanguage();

/* =========================================================
   MODALS
========================================================= */

openModalBtn?.addEventListener("click", () => {

  modal.classList.add("active");

});

closeModalBtn?.addEventListener("click", () => {

  modal.classList.remove("active");

});

closeProfileBtn?.addEventListener("click", () => {

  profileModal.classList.remove("active");

});

/* CLOSE OUTSIDE */

window.addEventListener("click", (e) => {

  if (e.target === modal) {
    modal.classList.remove("active");
  }

  if (e.target === profileModal) {
    profileModal.classList.remove("active");
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

  const phoneQ = query(
    collection(db, "members"),
    where("phone", "==", phone)
  );

  const nidQ = query(
    collection(db, "members"),
    where("nid", "==", nid)
  );

  const [phoneSnap, nidSnap] = await Promise.all([
    getDocs(phoneQ),
    getDocs(nidQ)
  ]);

  return !phoneSnap.empty || !nidSnap.empty;

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
      document.getElementById("name").value.trim();

    const phone =
      document.getElementById("phone").value.trim();

    const nid =
      document.getElementById("nid").value.trim();

    /* PHONE */

    if (!validatePhone(phone)) {

      alert(translations[lang].phoneError);

      return;

    }

    /* NID */

    if (!validateNID(nid)) {

      alert(translations[lang].nidError);

      return;

    }

    /* DUPLICATE */

    const isDuplicate =
      await checkDuplicate(phone, nid);

    if (isDuplicate) {

      alert(translations[lang].duplicateError);

      return;

    }

    /* SAVE */

    await addDoc(collection(db, "members"), {

      name,
      phone,
      nid,

      status:
        translations[lang].active,

      createdAt:
        serverTimestamp(),

      createdBy:
        localStorage.getItem("name") ||
        auth.currentUser?.displayName ||
        "Admin"

    });

    memberForm.reset();

    modal.classList.remove("active");

    loadMembers(true);

  } catch (err) {

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

    const fragment =
      document.createDocumentFragment();

    const memberPromises =
      snap.docs.map(async (docSnap) => {

        const m = docSnap.data();

        const id = docSnap.id;

        const [sSnap, lSnap, rSnap] =
          await Promise.all([

            getDocs(
              query(
                collection(db, "savings"),
                where("memberId", "==", id)
              )
            ),

            getDocs(
              query(
                collection(db, "loans"),
                where("memberId", "==", id)
              )
            ),

            getDocs(
              query(
                collection(db, "repayments"),
                where("memberId", "==", id)
              )
            )

          ]);

        let totalSavings = 0;

        let totalLoans = 0;

        let totalRepayments = 0;

        sSnap.forEach(d => {

          totalSavings +=
            Number(d.data().amount || 0);

        });

        lSnap.forEach(d => {

          totalLoans +=
            Number(d.data().amount || 0);

        });

        rSnap.forEach(d => {

          totalRepayments +=
            Number(d.data().amount || 0);

        });

        return {

          id,

          ...m,

          totalSavings,

          totalLoans,

          remainingLoan:
            totalLoans - totalRepayments

        };

      });

    const loadedMembers =
      await Promise.all(memberPromises);

    loadedMembers.forEach(member => {

      members.push(member);

      const row =
        document.createElement("tr");

      row.style.cursor = "pointer";

      row.innerHTML = `
        <td><strong>${member.name}</strong></td>
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
        <td>${member.createdBy || "-"}</td>
      `;

      row.onclick = () => {

        openProfile(member.id);

      };

      fragment.appendChild(row);

    });

    membersTable.appendChild(fragment);

  } catch (err) {

    console.error(err);

  }

  isLoadingMembers = false;

}

/* =========================================================
   OPEN PROFILE
========================================================= */

function openProfile(memberId) {

  currentMemberId = memberId;

  const member =
    members.find(m => m.id === memberId);

  if (!member) return;

  profileModal.classList.add("active");

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

  historyTable.innerHTML = "";

  lastTransactionDoc = null;

  hasMoreTransactions = true;

  loadTransactions();

}

/* =========================================================
   LOAD TRANSACTIONS
========================================================= */

async function loadTransactions() {

  if (loadingTransactions ||
      !hasMoreTransactions) return;

  loadingTransactions = true;

  try {

    let q = query(
      collection(db, "transactions"),
      where("memberId", "==", currentMemberId),
      orderBy("createdAt", "desc"),
      limit(transactionPageSize)
    );

    if (lastTransactionDoc) {

      q = query(
        collection(db, "transactions"),
        where("memberId", "==", currentMemberId),
        orderBy("createdAt", "desc"),
        startAfter(lastTransactionDoc),
        limit(transactionPageSize)
      );

    }

    const snap = await getDocs(q);

    if (snap.empty) {

      hasMoreTransactions = false;

      loadingTransactions = false;

      return;

    }

    lastTransactionDoc =
      snap.docs[snap.docs.length - 1];

    snap.forEach(doc => {

      const tx = doc.data();

      historyTable.insertAdjacentHTML(
        "beforeend",
        `
          <tr>
            <td>${tx.type}</td>
            <td>${tx.amount}</td>
            <td>${tx.previous}</td>
            <td>${tx.total}</td>
            <td>${tx.status}</td>
            <td>
              ${
                tx.createdAt?.toDate?.()
                ?.toLocaleString() || "-"
              }
            </td>
            <td>${tx.createdBy}</td>
          </tr>
        `
      );

    });

  } catch (err) {

    console.error(err);

  }

  loadingTransactions = false;

}

/* =========================================================
   INFINITE SCROLL
========================================================= */

historyContainer?.addEventListener("scroll", () => {

  const nearBottom =

    historyContainer.scrollTop +
    historyContainer.clientHeight >=
    historyContainer.scrollHeight - 50;

  if (nearBottom) {

    loadTransactions();

  }

});

/* =========================================================
   INIT
========================================================= */

loadMembers();
```
