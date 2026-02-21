/** Handles the login process by validating inputs and authenticating the user.
 * @async
 * @param {Event} event - The submit event from the login form.
 * @returns {Promise<void>}
 */
async function logIn(event) {
    event.preventDefault();

    let emailInput = document.getElementById('emailLogIn');
    let passwordInput = document.getElementById('passwordLogIn');
    let errorLogIn = document.getElementById("errorLogIn");

    let email = emailInput.value.trim();
    let password = passwordInput.value.trim();

    if (hasEmptyFields(email, password, emailInput, passwordInput, errorLogIn)) return;
    if (!isValidEmail(email, emailInput, errorLogIn)) return;

    await authenticateUser(email, password, passwordInput, errorLogIn);
}

/** Checks if email or password fields are empty and handles UI errors.
 * @param {string} email - The entered email.
 * @param {string} password - The entered password.
 * @param {HTMLInputElement} emailInput - The email input element.
 * @param {HTMLInputElement} passwordInput - The password input element.
 * @param {HTMLElement} errorContainer - The container for showing errors.
 * @returns {boolean} True if any field is empty, otherwise false. */
function hasEmptyFields(email, password, emailInput, passwordInput, errorContainer) {
    let isEmailEmpty = email === "";
    let isPasswordEmpty = password === "";

    if (isEmailEmpty || isPasswordEmpty) {
        errorContainer.classList.remove("d_none");
        errorContainer.textContent = "Please fill in both email and password.";
        if (isEmailEmpty) emailInput.classList.add("inputError");
        if (isPasswordEmpty) passwordInput.classList.add("inputError");
        return true;
    }

    return false;
}

/** Validates the email format and handles UI errors.
 * @param {string} email - The entered email.
 * @param {HTMLInputElement} emailInput - The email input element.
 * @param {HTMLElement} errorContainer - The container for showing errors.
 * @returns {boolean} True if email format is valid, otherwise false. */
function isValidEmail(email, emailInput, errorContainer) {
    let emailPattern = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

    if (!emailPattern.test(email)) {
        errorContainer.classList.remove("d_none");
        errorContainer.textContent = "Invalid email: @ or top level domain (e.g. .de) is missing.";
        emailInput.classList.add("inputError");
        return false;
    }

    emailInput.classList.remove("inputError");
    errorContainer.classList.add("d_none");
    return true;
}

/** Authenticates the user by comparing the entered credentials to stored ones. Updates the UI on success or failure.
 * @async
 * @param {string} email - The entered email.
 * @param {string} password - The entered password.
 * @param {HTMLInputElement} passwordInput - The password input element.
 * @param {HTMLElement} errorContainer - The container for showing errors.
 * @returns {Promise<void>} */
async function authenticateUser(email, password, passwordInput, errorContainer) {
    let users = await getUserByEmail(email);
    let user = Object.values(users)[0];

    if (user && user.password === password) {
        window.location.href = 'pages/summary.html';
    } else {
        passwordInput.value = "";
        passwordInput.classList.add("inputError");
        errorContainer.classList.remove("d_none");
        errorContainer.textContent = "Check your email and password. Please try again.";
    }
}

/** This function logs in the users as a guest by redirecting them to the summary page and stores the user role "guest" in the local storage. */ 
function logInGuest() {
    localStorage.setItem("userRole", "guest");
    window.location.href = 'pages/summary.html';
}

/** This function stores the email and the role "user" in the local storage in order to add the initials in the header later. */ 
function logInUser() {
    let email = document.getElementById("emailLogIn").value;
    localStorage.setItem("userRole", "user");
    localStorage.setItem("userEmail", email);
}

/** Shows or hides the password visibility toggle icon and updates input style. */
function changeIcon() {
    let passwordLogIn = document.getElementById('passwordLogIn');
    let icon = document.getElementById('togglePasswordIcon');

    if (passwordLogIn.value == "") {
        icon.classList.add("d_none");
        passwordLogIn.type = "password";
        passwordLogIn.classList.remove("password");
        icon.style.backgroundImage = "url('./assets/icons/visibility_off.svg')";
    } else {
        passwordLogIn.classList.add("password");
        icon.classList.remove("d_none");
    }
}

/** Toggles password visibility and updates the visibility icon accordingly. */
function togglePassword() {
    let passwordLogIn = document.getElementById('passwordLogIn');

    let icon = document.getElementById('togglePasswordIcon');

    if (passwordLogIn.type === "password") {
        passwordLogIn.type = "text";
        icon.style.backgroundImage = "url('./assets/icons/visibility.svg')";
    } else {
        passwordLogIn.type = "password";
        icon.style.backgroundImage = "url('./assets/icons/visibility_off.svg')";
    }
}

