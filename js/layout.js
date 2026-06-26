onAuthStateChanged(auth, async (user) => {

  if (!user) {
    // Check if Firebase has a pending token refresh error
    const currentUser = auth.currentUser;
    if (currentUser) {
      // User object exists but is null? Force a refresh.
      try {
        await currentUser.getIdToken(true); // Force refresh token
        console.log("Token refreshed successfully!");
        return; // Don't redirect
      } catch (error) {
        console.error("Token refresh failed:", error);
        // Redirect only if refresh fails
        window.location.href = "index.html";
      }
    } else {
      console.warn("User not authenticated, redirecting...");
      window.location.href = "index.html";
    }
    return;
  }

  console.log("Logged in:", user.email);
  // ... rest of your code
});
