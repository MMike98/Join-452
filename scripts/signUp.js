let users = [];

/**Saves new user into the API*/
function saveNewUser(event) {
  event.preventDefault();

  let { name, mail, password, confirm } = getUserInformation();

  if (isUsernameTaken(name)) {
    document.getElementById("nameSignUp").classList.add("inputError")
    userAlreadyExists("This username is already taken. Please try again.");
    return
  }
  if (isEmailTaken(mail)) {
    document.getElementById("emailSignUp").classList.add("inputError")
    userAlreadyExists("This Email is already taken. Please try again.");
    return
  } else {
    if (confirm === password) {
      let newUser = { name, mail, password };

      users.push(newUser);
      resetSignUpForm();
    } else {
      handlePasswordMismatch();
    }
  }
}

/** Get user information from the form*/
function getUserInformation() {
  let name = document.getElementById("nameSignUp").value;
  let mail = document.getElementById("emailSignUp").value;
  let password = document.getElementById("passwordSignUp").value;
  let confirm = document.getElementById("confirmSignUp").value;

  return { name, mail, password, confirm };
}

/** Checks if the Email already exists */
function isEmailTaken(mail) {
  return users.some((user) => user.mail === mail);
}

/** Checks if the username already exists */
function isUsernameTaken(name) {
  return users.some((user) => user.name === name);
}

/** If the user already exists: Resets the form and displays an error message */
function userAlreadyExists(message) {
  document.getElementById("nameSignUp").value = "";
  document.getElementById("passwordSignUp").value = "";
  document.getElementById("confirmSignUp").value = "";
  document.getElementById("checkPP").checked = false;

  document.getElementById("errorSignUp").classList.remove("d_none");
  document.getElementById("confirmSignUp").classList.remove("passwordInput");
  document.getElementById("passwordSignUp").classList.remove("passwordInput");
  document.getElementById("errorSignUp").textContent = message;
}

/** If all information is correct and could be pushed to the API: reset the sign up form */
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

  document.getElementById("passwordSignUp").classList.add("inputError")
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

// Shows the visibility toggle icon and updates the password input style when text is entered.
function changeIcon() {
  let passwordSignUp = document.getElementById('passwordSignUp');
  let icon = document.getElementById('togglePasswordIcon');

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

// Toggles the password visibility and updates the icon accordingly.
function togglePassword() {
  let passwordSignUp = document.getElementById('passwordSignUp');

  let icon = document.getElementById('togglePasswordIcon');

  if (passwordSignUp.type === "password") {
      passwordSignUp.type = "text";
      icon.style.backgroundImage = "url('../assets/icons/visibility.svg')";
  } else {
      passwordSignUp.type = "password";
      icon.style.backgroundImage = "url('../assets/icons/visibility_off.svg')";
  }
}

function changeIconConfirm() {
  let passwordInput = document.getElementById('confirmSignUp');
  let icon = document.getElementById('togglePasswordIconConfirm');

  if (passwordInput.value === "") {
      icon.classList.add("d_none");
      passwordInput.type = "password";
      passwordInput.classList.remove("password")
      icon.style.backgroundImage = "url('../assets/icons/visibility_off.svg')";
  } else {
      passwordInput.classList.add("password")
      icon.classList.remove("d_none");
  }
}

function togglePasswordConfirm() {
  let passwordInput = document.getElementById('confirmSignUp');
  let icon = document.getElementById('togglePasswordIconConfirm');

  if (passwordInput.type === "password") {
      passwordInput.type = "text";
      icon.style.backgroundImage = "url('../assets/icons/visibility.svg')";
  } else {
      passwordInput.type = "password";
      icon.style.backgroundImage = "url('../assets/icons/visibility_off.svg')";
  }
}