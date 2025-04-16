let users = [];
const BASE_URL = 'https://join-gruppenarbeit-a540b-default-rtdb.europe-west1.firebasedatabase.app';


/** fetches all users from the server and stores the result in the global users variable. */ 
async function getAllUsers() {
    let response = await fetch(`${BASE_URL}/users.json`);
    let data = await response.json();
    
    users = data
}