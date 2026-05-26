import { db, auth }
from "./firebase.js";

import {

  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp

}
from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================================================
   ELEMENTS
========================================================= */

const loansTable =
  document.getElementById("loansTable");

const loanForm =
  document.getElementById("loanForm");

const modal =
  document.getElementById("loanModal");

const openModalBtn =
  document.getElementById("openModalBtn");

const closeModalBtn =
  document.getElementById("closeModalBtn");

const searchInput =
  document.getElementById("searchMember");

const searchResults =
  document.getElementById("searchResults");

const selectedMember =
  document.getElementById("selectedMember");

/* =========================================================
   MODAL
========================================================= */

openModalBtn.onclick = () => {

  modal.style.display = "flex";

};

closeModalBtn.onclick = () => {

  modal.style.display = "none";

};

/* =========================================================
   SELECTED MEMBER
========================================================= */

let selected = null;

/* =========================================================
   SEARCH MEMBER
========================================================= */

searchInput.addEventListener(
  "input",
  async () => {

    const value =
      searchInput.value.toLowerCase();

    searchResults.innerHTML = "";

    if (!value) return;

    const snap =
      await getDocs(
        collection(db, "members")
      );

    snap.forEach((memberDoc) => {

      const m =
        memberDoc.data();

      if (

        m.name?.toLowerCase().includes(value) ||

        m.phone?.includes(value) ||

        m.nid?.includes(value)

      ) {

        const div =
          document.createElement("div");

        div.className =
          "search-item";

        div.innerHTML = `
          <strong>${m.name}</strong><br>
          <small>${m.phone}</small>
        `;

        div.onclick = () => {

          selected = {

            id: memberDoc.id,
            ...m

          };

          selectedMember.innerHTML = `
            👤 ${m.name}<br>
            📱 ${m.phone}
          `;

          searchResults.innerHTML = "";

        };

        searchResults.appendChild(div);

      }

    });

  }
);

/* =========================================================
   SAVE LOAN
========================================================= */

loanForm.addEventListener(
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

      const principal =
        Number(
          document.getElementById(
            "principal"
          ).value
        );

      const rate =
        Number(
          document.getElementById(
            "rate"
          ).value
        );

      const time =
        Number(
          document.getElementById(
            "time"
          ).value
        );

      const timeType =
        document.getElementById(
          "timeType"
        ).value;

      const interestType =
        document.getElementById(
          "interestType"
        ).value;

      let interest = 0;

      /* SIMPLE */

      if (
        interestType === "simple"
      ) {

        interest =
          principal *
          (rate / 100) *
          time;

      }

      /* COMPOUND */

      else if (
        interestType === "compound"
      ) {

        interest =

          principal *

          Math.pow(
            1 + rate / 100,
            time
          ) -

          principal;

      }

      /* FLAT */

      else {

        interest =
          principal *
          (rate / 100);

      }

      const total =
        principal + interest;

      const currentUserName =

        localStorage.getItem(
          "name"
        ) ||

        auth.currentUser
          ?.displayName ||

        "Admin";

      await addDoc(
        collection(db, "loans"),
        {

          memberId:
            selected.id,

          memberName:
            selected.name,

          memberPhone:
            selected.phone,

          principal,

          interest:
            Math.round(
              interest
            ),

          total:
            Math.round(
              total
            ),

          remaining:
            Math.round(
              total
            ),

          rate,

          time,

          timeType,

          interestType,

          status:
            "Active",

          createdAt:
            serverTimestamp(),

          createdBy:
            currentUserName

        }
      );

      alert(
        "Loan created successfully"
      );

      loanForm.reset();

      modal.style.display =
        "none";

      loadLoans();

    }

    catch (err) {

      console.error(err);

      alert(err.message);

    }

  }
);

/* =========================================================
   LOAD LOANS
========================================================= */

async function loadLoans() {

  loansTable.innerHTML = "";

  const snap =
    await getDocs(
      collection(db, "loans")
    );

  snap.forEach((loanDoc) => {

    const loan =
      loanDoc.data();

    const createdDate =
      loan.createdAt
        ? new Date(
            loan.createdAt.seconds *
            1000
          ).toLocaleString()
        : "-";

    const row = `

      <tr>

        <td>${loan.memberName}</td>

        <td>${loan.memberPhone}</td>

        <td>
          ${Number(
            loan.principal
          ).toLocaleString()} ETB
        </td>

        <td>
          ${Number(
            loan.interest
          ).toLocaleString()} ETB
        </td>

        <td>
          ${Number(
            loan.total
          ).toLocaleString()} ETB
        </td>

        <td>
          ${Number(
            loan.remaining
          ).toLocaleString()} ETB
        </td>

        <td>
          ${loan.interestType}
        </td>

        <td>
          ${loan.time}
          ${loan.timeType}
        </td>

        <td>
          ${loan.status}
        </td>

        <td>
          ${createdDate}
        </td>

        <td>
          ${loan.createdBy}
        </td>

        <td>

          <button
            onclick="deleteLoan('${loanDoc.id}')"
            class="delete-btn"
          >
            Delete
          </button>

        </td>

      </tr>

    `;

    loansTable.innerHTML += row;

  });

}

/* =========================================================
   DELETE
========================================================= */

window.deleteLoan =
  async function(id) {

    const ok =
      confirm(
        "Delete this loan?"
      );

    if (!ok) return;

    await deleteDoc(
      doc(db, "loans", id)
    );

    loadLoans();

  };

/* =========================================================
   START
========================================================= */

loadLoans();
