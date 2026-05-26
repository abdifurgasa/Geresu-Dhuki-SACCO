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

const savingsTable =
  document.getElementById("savingsTable");

const savingsForm =
  document.getElementById("savingsForm");

const amountInput =
  document.getElementById("amount");

const openModalBtn =
  document.getElementById("openModalBtn");

const closeModalBtn =
  document.getElementById("closeModalBtn");

const modal =
  document.getElementById("savingsModal");

const searchInput =
  document.getElementById("searchMember");

const searchResults =
  document.getElementById("searchResults");

const selectedMember =
  document.getElementById("selectedMember");

/* =========================================================
   OPEN / CLOSE MODAL
========================================================= */

openModalBtn?.addEventListener(
  "click",
  () => {

    modal.style.display = "flex";

  }
);

closeModalBtn?.addEventListener(
  "click",
  () => {

    modal.style.display = "none";

  }
);

/* =========================================================
   GLOBAL MEMBER
========================================================= */

let selected = null;

/* =========================================================
   SEARCH MEMBER
========================================================= */

searchInput?.addEventListener(
  "input",
  async () => {

    const val =
      searchInput.value.toLowerCase();

    searchResults.innerHTML = "";

    if (!val) return;

    const snap =
      await getDocs(
        collection(db, "members")
      );

    snap.forEach((doc) => {

      const m = doc.data();

      if (

        m.name?.toLowerCase().includes(val) ||

        m.phone?.includes(val) ||

        m.nid?.includes(val)

      ) {

        const div =
          document.createElement("div");

        div.className =
          "search-item";

        div.innerHTML = `

          <strong>
            ${m.name}
          </strong>

          <br>

          <small>
            ${m.phone}
          </small>

        `;

        div.onclick = () => {

          selected = {

            id: doc.id,
            ...m

          };

          selectedMember.innerHTML = `

            👤 ${m.name}

            <br>

            📱 ${m.phone}

          `;

          searchResults.innerHTML = "";

          searchInput.value = "";

        };

        searchResults.appendChild(div);

      }

    });

  }
);

/* =========================================================
   SAVE SAVINGS
========================================================= */

savingsForm?.addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();

    try {

      if (!selected) {

        alert(
          "Select member first"
        );

        return;

      }

      const amount =
        Number(amountInput.value);

      if (!amount || amount <= 0) {

        alert(
          "Enter valid amount"
        );

        return;

      }

      /* =====================================================
         GET PREVIOUS SAVINGS
      ===================================================== */

      const q = query(

        collection(db, "savings"),

        where(
          "memberId",
          "==",
          selected.id
        )

      );

      const snap =
        await getDocs(q);

      let previousSaving = 0;

      snap.forEach((doc) => {

        previousSaving += Number(
          doc.data().amount || 0
        );

      });

      /* =====================================================
         CALCULATE TOTAL
      ===================================================== */

      const totalSaving =
        previousSaving + amount;

      /* =====================================================
         CURRENT USER
      ===================================================== */

      const currentUserName =

        localStorage.getItem("name") ||

        auth.currentUser?.displayName ||

        "Admin";

      /* =====================================================
         SAVE FIREBASE
      ===================================================== */

      await addDoc(

        collection(db, "savings"),

        {

          memberId:
            selected.id,

          memberName:
            selected.name,

          memberPhone:
            selected.phone,

          amount:
            amount,

          previousSaving:
            previousSaving,

          totalSaving:
            totalSaving,

          createdAt:
            serverTimestamp(),

          createdBy:
            currentUserName

        }

      );

      alert(
        "Savings Added Successfully"
      );

      savingsForm.reset();

      selected = null;

      selectedMember.innerHTML =
        "👤 Select a member";

      modal.style.display =
        "none";

      loadSavings();

    }

    catch (err) {

      console.error(err);

      alert(err.message);

    }

  }
);

/* =========================================================
   LOAD SAVINGS
========================================================= */

async function loadSavings() {

  savingsTable.innerHTML = "";

  /* =====================================================
     GET MEMBERS
  ===================================================== */

  const membersSnap =
    await getDocs(
      collection(db, "members")
    );

  /* =====================================================
     GET SAVINGS
  ===================================================== */

  const savingsSnap =
    await getDocs(
      collection(db, "savings")
    );

  let savingsData = [];

  savingsSnap.forEach((doc) => {

    savingsData.push({

      id: doc.id,

      ...doc.data()

    });

  });

  /* =====================================================
     SORT BY DATE
  ===================================================== */

  savingsData.sort((a, b) => {

    const aTime =
      a.createdAt?.seconds || 0;

    const bTime =
      b.createdAt?.seconds || 0;

    return aTime - bTime;

  });

  /* =====================================================
     MEMBER LOOP
  ===================================================== */

  membersSnap.forEach((memberDoc) => {

    const member =
      memberDoc.data();

    const memberSavings =
      savingsData.filter(
        (s) =>
          s.memberId === memberDoc.id
      );

    if (memberSavings.length === 0)
      return;

    let depositAmount = 0;

    let previousSaving = 0;

    let totalSaving = 0;

    let createdDate = "-";

    let createdBy = "-";

    /* =====================================================
       TOTAL SAVINGS
    ===================================================== */

    memberSavings.forEach((s) => {

      totalSaving += Number(
        s.amount || 0
      );

    });

    /* =====================================================
       LATEST TRANSACTION
    ===================================================== */

    const latest =
      memberSavings[
        memberSavings.length - 1
      ];

    depositAmount =
      Number(latest.amount || 0);

    previousSaving =
      totalSaving - depositAmount;

    createdBy =
      latest.createdBy || "Admin";

    createdDate =
      latest.createdAt

        ? new Date(
            latest.createdAt.seconds *
            1000
          ).toLocaleString()

        : "-";

    /* =====================================================
       TABLE ROW
    ===================================================== */

    const row = `

      <tr>

        <td>
          ${member.name || "-"}
        </td>

        <td>
          ${member.phone || "-"}
        </td>

        <td>
          ${depositAmount.toLocaleString()} ETB
        </td>

        <td>
          ${previousSaving.toLocaleString()} ETB
        </td>

        <td>
          ${totalSaving.toLocaleString()} ETB
        </td>

        <td>
          ${createdDate}
        </td>

        <td>
          ${createdBy}
        </td>

      </tr>

    `;

    savingsTable.innerHTML += row;

  });

}

/* =========================================================
   START
========================================================= */

loadSavings();
