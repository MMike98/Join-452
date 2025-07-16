/** Gets E-Mail form signed up users from local storage */
async function getUserInitialsFromStorage() {
  let email = localStorage.getItem("userEmail");

  let data = await getUserByEmail(email);
  let users = Object.values(data || {});
  let user = users[0];

  if (user && user.name) {
    return getInitials(user.name);
  }
}

/** Displays the initials of the signed up user in the header, if the user is a guest dispaly "G" */
async function showUserInitial() {
  let userRole = localStorage.getItem("userRole");
  let userIcon = document.getElementById("userIcon");

  console.log("userRole");
  console.log("userIcon");

  if (userRole === "guest") {
    userIcon.innerHTML = "<strong>G</strong>";
  } else if (userRole === "user") {
    const initials = await getUserInitialsFromStorage();
    userIcon.innerHTML = `<strong>${initials}</strong>`;
  }
}

/** Resets local storage */
function logOut() {
  localStorage.removeItem("userRole");
  localStorage.removeItem("userEmail");
}
