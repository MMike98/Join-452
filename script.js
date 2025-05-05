const BASE_URL = "https://join-gruppenarbeit-a540b-default-rtdb.europe-west1.firebasedatabase.app";

/** Fetches a user from Firebase by email */
async function getUserByEmail(email) {
  let url = `${BASE_URL}/users.json?orderBy=%22email%22&equalTo=%22${email}%22`;
  let response = await fetch(url);
  let data = await response.json();
  return data;
}

function toggleDropdown() {
  document.getElementById("myDropdown").style.display = "block";
}

window.addEventListener("mouseup", function (event) {
  let menu = document.getElementById("myDropdown");
  if (event.target != menu && event.target.parentNode != menu) {
    menu.style.display = "none";
  }
})

/** Loads Contacts for dropdown menu for the addTask page */
async function loadContactsIntoDropdown() {
  let url = `${BASE_URL}/contacts.json`;
  let response = await fetch(url);
  let contacts = await response.json();

  let dropdown = document.getElementById("addTaskContact");
  dropdown.innerHTML = "";

  for (let key in contacts) {
    let contact = contacts[key];
    if (contact.name) {
      let label = document.createElement("label");
      label.innerHTML = `<input type="checkbox" value="${contact.name}"> ${contact.name}`;
      dropdown.appendChild(label);
    }
  }
}

/** Loads Categories for dropdown menu for the addTask page */
async function loadCategoriesIntoDropdown() {
  let url = `${BASE_URL}/tasks.json`;
  let response = await fetch(url);
  let tasks = await response.json();

  let dropdown = document.getElementById("addTaskCategory");
  dropdown.innerHTML = "";

  for (let key in tasks) {
    let task = tasks[key];
    if (task.title) {
      let label = document.createElement("label");
      label.innerHTML = `<input type="checkbox" value="${task.title}"> ${task.title}`;
      dropdown.appendChild(label);
    }
  }
}
