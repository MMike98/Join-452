let users = [];

/**Saves new user into the API*/
function saveNewUser() {
  let { name, mail, password, confirm } = getUserInformation();

  if (isUsernameTaken(name)) {
    userAlreadyExists("This username is already taken. Please try again.");
  } else {
    if (confirm === password) {
      let newUser = {
        name: name,
        mail: mail,
        password: password,
      };

      document.getElementById("nameSignUp").value = "";
      document.getElementById("emailSignUp").value = "";
      document.getElementById("passwordSignUp").value = "";
      document.getElementById("confirmSignUp").value = "";
      document.getElementById("checkPP").checked = false;

      document.getElementById("errorSignUp").classList.add("d_none");

      users.push(newUser);
    } else {
      document.getElementById("errorSignUp").classList.remove("d_none");
      document.getElementById("errorSignUp").textContent = "Your passwords don't match. Please try again.";

      document.getElementById("passwordSignUp").value = "";
      document.getElementById("confirmSignUp").value = "";
      document.getElementById("checkPP").checked = false;
    }
  }
}

/**Get user information entered from the form*/
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
  document.getElementById("errorSignUp").textContent = message;
}
