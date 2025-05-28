// src/utils/logout.js

export function logoutUser() {
  // Clear all local/session storage (tokens, user data, etc.)
  localStorage.clear();
  sessionStorage.clear();

  // If you have any cookies to clear (e.g., JWT cookies), add that logic here
  // document.cookie = "token=; Max-Age=0; path=/;";

  // Optionally: Add any additional cleanup (e.g., clear Redux/Context if needed)
}
