import { db, auth } from "./firebase.js";

import {

  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc

} from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
   GLOBAL SELECTED MEMBER
========================================================= */

let selected = null;

/* =========================================================
   OPEN MODAL
========================================================= */

openModalBtn?.addEventListener(
  "click",
  () => {

    if (!selected) {

      alert("Please select member first");

      return;

    }

    modal.style.display = "flex";

  }
);

/* =========================================================
   CLOSE MODAL
========================================================= */

closeModalBtn?.addEventListener(
  "click",
  () => {

    modal.style.display = "none";

  }
);

/* =========================================================
   SEARCH MEMBER
========================================================= */

searchInput?.addEventListener(
  "input",
  async () => {

    const value =
      searchInput.value.trim().toLowerCase();

    searchResults.innerHTML = "";

    if (!value) {

      searchResults.style.display = "none";

      return;

    }

    try {

      const snap =
        await getDocs(
          collection(db, "members")
        );

      let found = false;

      snap.forEach((memberDoc) => {

        const member =
          memberDoc.data();

        const name =
          member.name?.toLowerCase() || "";

        const phone =
          member.phone || "";

        const nid =
          member.nid || "";

        if (

          name.includes(value) ||
          phone.includes(value) ||
          nid.includes(value)

        ) {

          found = true;

          const item =
            document.createElement("div");

          item.className =
            "search-item";

          item.innerHTML = `

            <strong>
              ${member.name}
            </strong>

            <br>

            <small>
              📱 ${member.phone}
            </small>

          `;

          /* SELECT MEMBER */

          item.addEventListener(
            "click",
            () => {

              selected = {

                id: memberDoc.id,
                ...member

              };

              selectedMember.innerHTML = `

                👤 <strong>
                  ${member.name}
                </strong>

                <br>

                📱 ${member.phone}

              `;

              searchInput.value =
                member.name;

              searchResults.innerHTML = "";

              searchResults.style.display =
                "none";

            }
          );

          searchResults.appendChild(item);

        }

      });

      if (found) {

        searchResults.style.display =
          "block";

      }

      else {

        searchResults.innerHTML = `

          <div class="search-item">

            No member found

          </div>

        `;

        searchResults.style.display =
          "block";

      }

    }

    catch (error) {

      console.error(error);

    }

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

        alert("Please select member");

        return;

      }

      const amount =
        Number(amountInput.value);

      if (!amount || amount <= 0) {

        alert("Enter valid amount");

        return;

      }

      /* =====================================================
         GET MEMBER SAVINGS
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

      let totalPrevious = 0;

      snap.forEach((d) => {

        totalPrevious += Number(
          d.data().depositAmount || 0
        );

      });

      /* =====================================================
         CALCULATIONS
      ===================================================== */

      const currentDeposit =
        amount;

      const previousSaving =
        totalPrevious;

      const totalSaving =
        previousSaving + currentDeposit;

      /* =====================================================
         USER NAME
      ===================================================== */

      const createdBy =

        localStorage.getItem("name") ||

        auth.currentUser?.displayName ||

        auth.currentUser?.email ||

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

          createdBy:
            createdBy,

          createdAt:
            serverTimestamp()

        }
      );

      alert(
        "Savings added successfully"
      );

      amountInput.value = "";

      modal.style.display = "none";

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

  try {

    const snap =
      await getDocs(
        collection(db, "savings")
      );

    let data = [];

    snap.forEach((docSnap) => {

      data.push({

        id: docSnap.id,

        ...docSnap.data()

      });

    });

    /* SORT LATEST */

    data.sort((a, b) => {

      const aTime =
        a.createdAt?.seconds || 0;

      const bTime =
        b.createdAt?.seconds || 0;

      return bTime - aTime;

    });

    /* TABLE */

    data.forEach((item) => {

      const createdDate =

        item.createdAt

          ? new Date(

              item.createdAt.seconds *
              1000

            ).toLocaleString()

          : "-";

      const row = `

        <tr>

          <td>
            ${item.memberName || "-"}
          </td>

          <td>
            ${item.memberPhone || "-"}
          </td>

          <td>

            ${Number(
              item.depositAmount || 0
            ).toLocaleString()} ETB

          </td>

          <td>

            ${Number(
              item.previousSaving || 0
            ).toLocaleString()} ETB

          </td>

          <td>

            ${Number(
              item.totalSaving || 0
            ).toLocaleString()} ETB

          </td>

          <td>
            ${createdDate}
          </td>

          <td>
            ${item.createdBy || "-"}
          </td>

          <td>

            <button
              onclick="editSavings('${item.id}')"
              class="edit-btn"
            >
              ✏️
            </button>

            <button
              onclick="deleteSavings('${item.id}')"
              class="delete-btn"
            >
              🗑️
            </button>

          </td>

        </tr>

      `;

      savingsTable.innerHTML += row;

    });

  }

  catch (err) {

    console.error(err);

  }

}

/* =========================================================
   DELETE SAVINGS
========================================================= */

window.deleteSavings =
  async function (id) {

    const confirmDelete =
      confirm(
        "Delete this savings?"
      );

    if (!confirmDelete) return;

    try {

      await deleteDoc(
        doc(db, "savings", id)
      );

      loadSavings();

    }

    catch (err) {

      console.error(err);

    }

  };

/* =========================================================
   EDIT SAVINGS
========================================================= */

window.editSavings =
  async function (id) {

    const newAmount =
      prompt("Enter new amount");

    if (!newAmount) return;

    try {

      await updateDoc(
        doc(db, "savings", id),
        {

          depositAmount:
            Number(newAmount)

        }
      );

      loadSavings();

    }

    catch (err) {

      console.error(err);

    }

  };

/* =========================================================
   START
========================================================= */

loadSavings();
