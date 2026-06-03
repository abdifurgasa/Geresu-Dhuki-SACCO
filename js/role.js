import { auth, db } from "./firebase.js";

import {
doc,
getDoc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

onAuthStateChanged(auth, async(user)=>{

if(!user) return;

const userDoc =
await getDoc(
doc(db,"users",user.uid)
);

if(!userDoc.exists()) return;

const role =
userDoc.data().role;

applyRole(role);

});

function applyRole(role){

if(role === "admin") return;

/* Hide admin-only menus */

document
.querySelectorAll(".admin-only")
.forEach(el=>{

el.style.display = "none";

});

if(role === "user"){

document
.querySelectorAll(".manager-only")
.forEach(el=>{

el.style.display = "none";

});

}

}
