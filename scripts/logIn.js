// checks if the entered email and password match an existing user. If a match is found, it redirects to the summary page. Otherwise, it displays an error message.
async function logIn(event) {
    event.preventDefault();
    const emailInput = document.getElementById('emailLogIn');
    const passwordInput = document.getElementById('passwordLogIn');
    let email = emailInput.value;
    let password = passwordInput.value;
    const users = await getUserByEmail(email);
    const user = Object.values(users)[0];
    if (user && user.password === password) {
        window.location.href = 'pages/summary.html';
    } else {
        passwordInput.value = "";
        document.getElementById("errorLogIn").classList.remove("d_none");
        document.getElementById("errorLogIn").textContent = "Check your email and password. Please try again.";
        passwordInput.classList.add("inputError");
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

// Shows the visibility toggle icon and updates the password input style when text is entered.
function changeIcon() {
    let passwordLogIn = document.getElementById('passwordLogIn');
    let icon = document.getElementById('togglePasswordIcon');

    if (passwordLogIn.value == "") {
        icon.classList.add("d_none");
        passwordLogIn.type = "password";
        passwordLogIn.classList.remove("password");
        icon.style.backgroundImage = "url('../assets/icons/visibility_off.svg')";
    } else {
        passwordLogIn.classList.add("password");
        icon.classList.remove("d_none");
    }
}

// Toggles the password visibility and updates the icon accordingly.
function togglePassword() {
    let passwordLogIn = document.getElementById('passwordLogIn');

    let icon = document.getElementById('togglePasswordIcon');

    if (passwordLogIn.type === "password") {
        passwordLogIn.type = "text";
        icon.style.backgroundImage = "url('../assets/icons/visibility.svg')";
    } else {
        passwordLogIn.type = "password";
        icon.style.backgroundImage = "url('../assets/icons/visibility_off.svg')";
    }
}

