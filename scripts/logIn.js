let users = [];
const BASE_URL = 'https://join-gruppenarbeit-a540b-default-rtdb.europe-west1.firebasedatabase.app';

async function getAllUseers() {
    let response = await fetch(`${BASE_URL}/users.json`);
    let data = await response.json();

    users = data
}

function logIn() {
    let email = document.getElementById('emailLogIn').value;
    let password = document.getElementById('passwordLogIn').value;

    const user = Object.values(users).find(u => u.email === email && u.password === password);

    if (user) {
        window.location.href = 'pages/summary.html';
    } else {
        document.getElementById("errorLogIn").classList.remove("d_none");
        document.getElementById("errorLogIn").textContent = "Check your email and password. Please try again.";
    }
}

function logInGuest() {
    window.location.href = 'pages/summary.html';
}

getAllUseers();
