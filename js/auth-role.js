export function setUserSession(user) {
  localStorage.setItem("userId", user.uid);
  localStorage.setItem("userName", user.displayName || "Unknown User");
  localStorage.setItem("userEmail", user.email);

  // ROLE (you can store from Firestore later)
  localStorage.setItem("role", user.role || "user");
}

export function getUserName() {
  return localStorage.getItem("userName") || "Unknown User";
}

export function isAdmin() {
  return localStorage.getItem("role") === "admin";
}
