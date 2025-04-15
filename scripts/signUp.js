let users = [];

/**Saves new user into the API*/
function saveNewUser() {
  let { name, mail, password, confirm } = getUserInformation();

  if (isUsernameTaken(name)) {
    userAlreadyExists("This username is already taken. Please try again.");
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

/** Checks if the username already exists */
function isUsernameTaken(name) {
  return users.some((user) => user.name === name);
}

/** If the user already exists: Resets the form fields and displays an error message */
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

/** If all information is correct and can be pushed to the API: reset the sign up form */
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

/** If the password and the confirmation of the password are not the same, display error */
function handlePasswordMismatch() {
  document.getElementById("errorSignUp").classList.remove("d_none");
  document.getElementById("errorSignUp").textContent = "Your passwords don't match. Please try again.";

  document.getElementById("passwordSignUp").value = "";
  document.getElementById("confirmSignUp").value = "";
  document.getElementById("checkPP").checked = false;
}

/** Check if the password under "confirm password" is the same than unter "password" */
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

/** Change the icon of the confirm/password input field, when typing in the password resp. the confirmation */
function changeIcon(inputId) {
  document.getElementById(inputId).classList.add("passwordInput");
}