let users = [];
const BASE_URL = 'https://join-gruppenarbeit-a540b-default-rtdb.europe-west1.firebasedatabase.app';


// fetches all users from the server and stores the result in the global users variable.
async function getAllUseers() {
    let response = await fetch(`${BASE_URL}/users.json`);
    let data = await response.json();

    users = data
}

// checks if the entered email and password match an existing user. If a match is found, it redirects to the summary page. Otherwise, it displays an error message.
function logIn() {
    let email = document.getElementById('emailLogIn').value;
    let password = document.getElementById('passwordLogIn').value;

    const user = Object.values(users).find(u => u.email === email && u.password === password);

    if (user) {
        window.location.href = 'pages/summary.html';
    } else {
        document.getElementById('passwordLogIn').value = ""
        document.getElementById("errorLogIn").classList.remove("d_none");
        document.getElementById("errorLogIn").textContent = "Check your email and password. Please try again.";
        document.getElementById('passwordLogIn').classList.add("inputError");
    }
}

// This function logs in the user as a guest by redirecting them to the summary page.
function logInGuest() {
    window.location.href = 'pages/summary.html';
}

// Shows the visibility toggle icon and updates the password input style when text is entered.
function changeIcon() {
    let passwordInput = document.getElementById('passwordLogIn');
    let icon = document.getElementById('togglePasswordIcon');

    if (passwordInput.value === "") {
        icon.classList.add("d_none");
        passwordInput.type = "password";
        passwordInput.classList.remove("passwordLogIn")
    } else {
        passwordInput.classList.add("passwordLogIn")
        icon.classList.remove("d_none");
    }
}

// Toggles the password visibility and updates the icon accordingly.
function togglePassword() {
    let passwordInput = document.getElementById('passwordLogIn');
    let icon = document.getElementById('togglePasswordIcon');

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        icon.style.backgroundImage = "url('../assets/icons/visibility.svg')";
    } else {
        passwordInput.type = "password";
        icon.style.backgroundImage = "url('../assets/icons/visibility_off.svg')";
    }
}

getAllUseers();
