/**Saves new user. Handles manual validation and saves a new user if inputs are valid. */
async function saveNewUser(event) {
  event.preventDefault();

  clearSignUpErrors();

  let { name, email, password, confirm } = getUserInformation();
  let checkbox = document.getElementById("checkPP");

  if (!name || !email || !password || !confirm) {
    showSignUpError("Please fill in all fields.");
    highlightEmptyFields({ name, email, password, confirm });
    return;
  }

  if (!isValidEmail(email)) {
    showSignUpError("Invalid email: @ or top level domain (e.g. .de) is missing.");
    document.getElementById("emailSignUp").classList.add("inputError");
    return;
  }

  if (!checkbox.checked) {
    showSignUpError("You must accept the privacy policy.");
    return;
  }

  if (password !== confirm) {
    return handlePasswordMismatch();
  }

  if (await isEmailTaken(email)) {
    return;
  }

  let newUser = { name, email, password };
  await loadIntoAPI(newUser);
  resetSignUpForm();
  successSignUp();
}

/** Validates the email format manually. */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(email.toLowerCase());
}

/** Displays a signup error message. */
function showSignUpError(message) {
  let error = document.getElementById("errorSignUp");
  error.classList.remove("d_none");
  error.textContent = message;
}

/** Highlights empty fields by adding the inputError class. */
function highlightEmptyFields({ name, email, password, confirm }) {
  if (!name) document.getElementById("nameSignUp").classList.add("inputError");
  if (!email) document.getElementById("emailSignUp").classList.add("inputError");
  if (!password) document.getElementById("passwordSignUp").classList.add("inputError");
  if (!confirm) document.getElementById("confirmSignUp").classList.add("inputError");
}

/** Removes all previous error styles from the sign-up form. */
function clearSignUpErrors() {
  document.getElementById("nameSignUp").classList.remove("inputError");
  document.getElementById("emailSignUp").classList.remove("inputError");
  document.getElementById("passwordSignUp").classList.remove("inputError");
  document.getElementById("confirmSignUp").classList.remove("inputError");
  document.getElementById("errorSignUp").classList.add("d_none");
}

/** Shows success message and redirects to login after 2s */
function successSignUp() {
  document.getElementById("singUpMsg").classList.remove("d_none")
  document.getElementById("content").classList.add("slide-up")
  setTimeout(() => {
    window.location.href = "../index.html?"
  }, 2000)
}

/** Checks if the Email already exists */
async function isEmailTaken(email) {
  let taken = false
  const users = await getUserByEmail(email);
  const user = Object.values(users)[0];
  if (user) {
    document.getElementById("emailSignUp").classList.add("inputError");
    userAlreadyExists("This Email is already taken. Please try again.");
    taken = true
    return taken;
  }
  return taken;
}

/** Loads data into the API */
async function loadIntoAPI(newUser) {
  let lastIdRes = await fetch(`${BASE_URL}/users/lastUserId.json`);
  let lastId = parseInt(await lastIdRes.json()) || 0;

  let nextId = lastId + 1;
  let newUserKey = `user${nextId}`;

  await fetch(`${BASE_URL}/users/${newUserKey}.json`, {
    method: "PUT",
    body: JSON.stringify(newUser)
  });

  await fetch(`${BASE_URL}/users/lastUserId.json`, {
    method: "PUT",
    body: JSON.stringify(nextId)
  });
}

/** Get user information from the form */
function getUserInformation() {
  let name = document.getElementById("nameSignUp").value;
  let email = document.getElementById("emailSignUp").value;
  let password = document.getElementById("passwordSignUp").value;
  let confirm = document.getElementById("confirmSignUp").value;

  return { name, email, password, confirm };
}

/** If the mail already exists: Resets the form and displays an error message */
function userAlreadyExists(message) {
  document.getElementById("emailSignUp").value = "";
  document.getElementById("passwordSignUp").value = "";
  document.getElementById("confirmSignUp").value = "";
  document.getElementById("checkPP").checked = false;

  document.getElementById("errorSignUp").classList.remove("d_none");
  document.getElementById("confirmSignUp").classList.remove("passwordInput");
  document.getElementById("passwordSignUp").classList.remove("passwordInput");
  document.getElementById("errorSignUp").textContent = message;
}

/** If all information is correct and could be uploaded to the API: reset the sign up form */
function resetSignUpForm() {
  document.getElementById("nameSignUp").value = "";
  document.getElementById("emailSignUp").value = "";
  document.getElementById("passwordSignUp").value = "";
  document.getElementById("confirmSignUp").value = "";
  document.getElementById("checkPP").checked = false;

  document.getElementById("errorSignUp").classList.add("d_none");
  document.getElementById("confirmSignUp").classList.remove("passwordInput");
  document.getElementById("passwordSignUp").classList.remove("passwordInput");
}

/** If the password and the confirmation of the password are not the same: display error */
function handlePasswordMismatch() {
  document.getElementById("errorSignUp").classList.remove("d_none");
  document.getElementById("errorSignUp").textContent = "Your passwords don't match. Please try again.";

  document.getElementById("passwordSignUp").classList.add("inputError");
  document.getElementById("passwordSignUp").value = "";
  document.getElementById("confirmSignUp").value = "";
  document.getElementById("checkPP").checked = false;
}

/** Check if the password under "confirm password" is the same than under "password" */
function checkPassword() {
  let { password, confirm } = getUserInformation();

  if (confirm !== password) {
    document.getElementById("errorSignUp").classList.remove("d_none");
    document.getElementById("errorSignUp").textContent = "Your passwords don't match. Please try again.";
    document.getElementById("confirmSignUp").classList.add("confirmError");
  } else {
    document.getElementById("errorSignUp").classList.add("d_none");
    document.getElementById("confirmSignUp").classList.remove("confirmError");
  }
}

/** Shows the visibility toggle icon and updates the password input style when text is entered. */
function changeIcon() {
  let passwordSignUp = document.getElementById("passwordSignUp");
  let icon = document.getElementById("togglePasswordIcon");

  if (passwordSignUp.value === "") {
    icon.classList.add("d_none");
    passwordSignUp.type = "password";
    passwordSignUp.classList.remove("password");
    icon.style.backgroundImage = "url('../assets/icons/visibility_off.svg')";
  } else {
    passwordSignUp.classList.add("password");
    icon.classList.remove("d_none");
  }
}

/** Toggles the password visibility and updates the icon accordingly. */
function togglePassword() {
  let passwordSignUp = document.getElementById("passwordSignUp");
  let icon = document.getElementById("togglePasswordIcon");

  if (passwordSignUp.type === "password") {
    passwordSignUp.type = "text";
    icon.style.backgroundImage = "url('../assets/icons/visibility.svg')";
  } else {
    passwordSignUp.type = "password";
    icon.style.backgroundImage = "url('../assets/icons/visibility_off.svg')";
  }
}

/** Shows the visibility toggle icon and updates the password confirmation input style when text is entered. */
function changeIconConfirm() {
  let passwordInput = document.getElementById("confirmSignUp");
  let icon = document.getElementById("togglePasswordIconConfirm");

  if (passwordInput.value === "") {
    icon.classList.add("d_none");
    passwordInput.type = "password";
    passwordInput.classList.remove("password");
    icon.style.backgroundImage = "url('../assets/icons/visibility_off.svg')";
  } else {
    passwordInput.classList.add("password");
    icon.classList.remove("d_none");
  }
}

/** Toggles the password confirmation visibility and updates the icon accordingly. */
function togglePasswordConfirm() {
  let passwordInput = document.getElementById("confirmSignUp");
  let icon = document.getElementById("togglePasswordIconConfirm");

  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    icon.style.backgroundImage = "url('../assets/icons/visibility.svg')";
  } else {
    passwordInput.type = "password";
    icon.style.backgroundImage = "url('../assets/icons/visibility_off.svg')";
  }
}
