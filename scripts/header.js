/** Retrieves the initials of the currently signed-up user from local storage.
 * @async
 * @returns {Promise<string|undefined>} The initials of the user, or undefined if no user is found. */
async function getUserInitialsFromStorage() {
  let email = localStorage.getItem("userEmail");

  let data = await getUserByEmail(email);
  let users = Object.values(data || {});
  let user = users[0];

  if (user && user.name) {
    return getInitials(user.name);
  }
}

/** Displays the initials of the signed-up user in the header. If the user is a guest, displays "G".
 * @async
 * @returns {Promise<void>} */
async function showUserInitial() {
  let userRole = localStorage.getItem("userRole");
  let userIcon = document.getElementById("userIcon");

  if (userRole === "guest") {
    userIcon.innerHTML = "<strong>G</strong>";
  } else if (userRole === "user") {
    const initials = await getUserInitialsFromStorage();
    userIcon.innerHTML = `<strong>${initials}</strong>`;
  }
}

/** Logs out the current user by removing relevant local storage items. */
function logOut() {
  localStorage.removeItem("userRole");
  localStorage.removeItem("userEmail");
}
