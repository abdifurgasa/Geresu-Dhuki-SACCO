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

const memberForm =
  document.getElementById("memberForm");

const membersTable =
  document.getElementById("membersTable");

const searchInput =
  document.getElementById("searchMember");

const searchResults =
  document.getElementById("searchResults");

const selectedMember =
  document.getElementById("selectedMember");

const modal =
  document.getElementById("memberModal");

const openModalBtn =
  document.getElementById("openModalBtn");

const closeModalBtn =
  document.getElementById("closeModalBtn");

/* =========================================================
   MODAL SYSTEM
========================================================= */

function openModal() {

  modal.style.display = "flex";

}

function closeModal() {

  modal.style.display = "none";

}

/* OPEN BUTTON */
if (openModalBtn) {

  openModalBtn.addEventListener(
    "click",
    openModal
  );

}

/* CLOSE BUTTON */
if (closeModalBtn) {

  closeModalBtn.addEventListener(
    "click",
    closeModal
  );

}

/* CLOSE OUTSIDE */
window.addEventListener("click", (e) => {

  if (e.target === modal) {

    closeModal();

  }

});

/* =========================================================
   SAVE MEMBER
========================================================= */

if (memberForm) {

  memberForm.addEventListener(
    "submit",
    async (e) => {

      e.preventDefault();

      try {

        /* VALUES */
        const name =
          document
            .getElementById("name")
            .value
            .trim();

        const phone =
          document
            .getElementById("phone")
            .value
            .trim();

        const nid =
          document
            .getElementById("nid")
            .value
            .trim();

        /* VALIDATION */
        if (phone.length !== 9) {

          alert(
            "Phone must be 9 digits"
          );

          return;

        }

        if (nid.length !== 16) {

          alert(
            "NID must be 16 digits"
          );

          return;

        }

        /* DUPLICATE PHONE */
        const phoneSnap =
          await getDocs(

            query(

              collection(db, "members"),

              where(
                "phone",
                "==",
                phone
              )

            )

          );

        if (!phoneSnap.empty) {

          alert(
            "Phone already exists"
          );

          return;

        }

        /* DUPLICATE NID */
        const nidSnap =
          await getDocs(

            query(

              collection(db, "members"),

              where(
                "nid",
                "==",
                nid
              )

            )

          );

        if (!nidSnap.empty) {

          alert(
            "NID already exists"
          );

          return;

        }

        /* CURRENT USER */
        const user =
          auth.currentUser;

        /* SAVE TO FIRESTORE */
        await addDoc(

          collection(db, "members"),

          {

            name,
            phone,
            nid,

            savings: 0,

            loanTotal: 0,

            loanRemaining: 0,

            status: "active",

            createdAt:
              serverTimestamp(),

            createdBy:
              user
                ? user.email
                : "admin"

          }

        );

        alert(
          "✅ Member saved successfully"
        );

        /* RESET */
        memberForm.reset();

        /* CLOSE MODAL */
        closeModal();

        /* RELOAD MEMBERS */
        loadMembers();

      } catch (error) {

        console.error(error);

        alert(
          "❌ Error: " +
          error.message
        );

      }

    }

  );

}

/* =========================================================
   LOAD MEMBERS
========================================================= */

async function loadMembers() {

  if (!membersTable) return;

  membersTable.innerHTML = "";

  try {

    const snapshot =
      await getDocs(
        collection(db, "members")
      );

    snapshot.forEach((doc) => {

      const m = doc.data();

      membersTable.innerHTML += `

        <tr>

          <td>👤</td>

          <td>${m.name}</td>

          <td>${m.phone}</td>

          <td>${m.nid}</td>

          <td>${m.savings}</td>

          <td>${m.loanTotal}</td>

          <td>${m.loanRemaining}</td>

          <td>

            <span class="badge active">

              ${m.status}

            </span>

          </td>

          <td>

            ${
              m.createdAt
              ? new Date(
                  m.createdAt.seconds
                  * 1000
                ).toLocaleDateString()
              : "-"
            }

          </td>

          <td>${m.createdBy}</td>

        </tr>

      `;

    });

  } catch (error) {

    console.error(error);

  }

}

loadMembers();

/* =========================================================
   SEARCH MEMBER
========================================================= */

if (searchInput) {

  searchInput.addEventListener(
    "input",
    async () => {

      const value =
        searchInput.value
          .toLowerCase();

      searchResults.innerHTML = "";

      if (!value) return;

      const snapshot =
        await getDocs(
          collection(db, "members")
        );

      snapshot.forEach((doc) => {

        const m = doc.data();

        if (

          m.name
            .toLowerCase()
            .includes(value)

          ||

          m.phone
            .includes(value)

          ||

          m.nid
            .includes(value)

        ) {

          const div =
            document.createElement("div");

          div.className =
            "search-item";

          div.innerHTML = `

            <strong>
              ${m.name}
            </strong>

            <small>
              ${m.phone}
            </small>

          `;

          div.onclick = () => {

            selectedMember.innerHTML = `

              👤 ${m.name}
              <br>

              📱 ${m.phone}
              <br>

              🆔 ${m.nid}
              <br>

              💰 Savings:
              ${m.savings}

            `;

            searchResults.innerHTML = "";

          };

          searchResults.appendChild(div);

        }

      });

    }

  );

}
