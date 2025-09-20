const BASE_URL =
  "https://join-gruppenarbeit-a540b-default-rtdb.europe-west1.firebasedatabase.app";

let circleColors = [
  "#FF7A00",
  "#9327FF",
  "#6E52FF",
  "#FC71FF",
  "#FFBB2B",
  "#1FD7C1",
  "#462F8A",
  "#FF4646",
  "#00BEE8",
];

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
  if (menu && event.target != menu && event.target.parentNode != menu) {
    menu.style.display = "none";
  }
});

/** Fetchs Contacts from API */
async function fetchContacts() {
  let url = `${BASE_URL}/contacts.json`;
  let response = await fetch(url);
  let contacts = await response.json();
  return contacts;
}

/** Fetchs Categories from API */
async function fetchTasks() {
  const url = `${BASE_URL}/tasks.json`;
  const response = await fetch(url);
  const tasks = await response.json();
  return tasks;
}

/** Extracts the initials of the signed up name */
function getInitials(name) {
  let nameParts = name.split(" ");

  if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase();
  }

  let firstInitial = nameParts[0]?.charAt(0).toUpperCase();
  let secondInitial = nameParts[1]?.charAt(0).toUpperCase();
  return firstInitial + secondInitial;
}

/** Closes the contact add/edit overlays and resets the form. */
function closeOverlay(event) {
  if (event && event.target !== event.currentTarget) {
    return;
  }

  const overlayIds = ["contactAdd","contactEdit","contactDetails","addTaskBoard",];

  overlayIds.forEach((id) => {
    let overlay = document.getElementById(id);
    if (overlay && overlay.classList.contains("open")) {
      overlay.classList.remove("open");

      if (["contactAdd", "contactEdit", "contactDetails"].includes(id)) {
        resetContactForm(id);
      }
    }
  });
}
