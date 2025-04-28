const BASE_URL = 'https://join-gruppenarbeit-a540b-default-rtdb.europe-west1.firebasedatabase.app';

/** Fetches a user from Firebase by email */
async function getUserByEmail(email) {
    const url = `${BASE_URL}/users.json?orderBy=%22email%22&equalTo=%22${email}%22`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
}


function toggleDropdown() {
    document.getElementById("myDropdown").classList.toggle("d_none");
}