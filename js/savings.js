import { db, auth } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  orderBy
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
   MODAL
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
   SELECTED MEMBER
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
         GET ALL PREVIOUS SAVINGS
      ===================================================== */

      const savingsQuery = query(

        collection(db, "savings"),

        where(
          "memberId",
          "==",
          selected.id
        )

      );

      const savingsSnap =
        await getDocs(savingsQuery);

      let previousSaving = 0;

      savingsSnap.forEach((doc) => {

        previousSaving += Number(
          doc.data().amount || 0
        );

      });

      /* =====================================================
         CALCULATIONS
      ===================================================== */

      const currentDeposit =
        amount;

      const totalSaving =
        previousSaving +
        currentDeposit;

      /* =====================================================
         CREATED BY
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

          depositAmount:
            currentDeposit,

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
        "Savings added successfully"
      );

      amountInput.value = "";

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
   LOAD SAVINGS TABLE
========================================================= */

async function loadSavings() {

  savingsTable.innerHTML = "";

  /* =====================================================
     GET SAVINGS
  ===================================================== */

  const savingsSnap =
    await getDocs(

      query(
        collection(db, "savings"),
        orderBy(
          "createdAt",
          "desc"
        )
      )

    );

  /* =====================================================
     DISPLAY TABLE
  ===================================================== */

  savingsSnap.forEach((doc) => {

    const data =
      doc.data();

    const row = `

      <tr>

        <td>
          ${data.memberName || "-"}
        </td>

        <td>
          ${data.memberPhone || "-"}
        </td>

        <td>
          ${Number(
            data.depositAmount || 0
          ).toLocaleString()} ETB
        </td>

        <td>
          ${Number(
            data.previousSaving || 0
          ).toLocaleString()} ETB
        </td>

        <td>
          ${Number(
            data.totalSaving || 0
          ).toLocaleString()} ETB
        </td>

        <td>

          ${data.createdAt

            ? new Date(
                data.createdAt.seconds *
                1000
              ).toLocaleString()

            : "-"}

        </td>

        <td>
          ${data.createdBy || "Admin"}
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
