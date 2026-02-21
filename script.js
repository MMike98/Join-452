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

/** Fetches the current user's name or returns 'Guest' if not logged in */
async function fetchCurrentUser() {
  let userRole = localStorage.getItem("userRole");
  let email = localStorage.getItem("userEmail");

  if (userRole === "guest" || !email) {
    return "Guest";
  }

  try {
    let userData = await getUserByEmail(email);

    if (!userData || Object.keys(userData).length === 0) {
      console.warn("No user found for email:", email);
      return "Guest";
    }

    let userId = Object.keys(userData)[0];
    let user = userData[userId];

    if (!user || !user.name) {
      console.warn("User data is missing 'name' field:", user);
      return "Guest";
    }

    return user.name;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return "Guest";
  }
}

/** Fetches a user from Firebase by email */
async function getUserByEmail(email) {
  if (!email) return {};

  try {
    let url = `${BASE_URL}/users.json?orderBy=%22email%22&equalTo=%22${email}%22`;
    let response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return {};
  }
}


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
  if (!name) return "";

  let trimmedName = name.trim();
  let firstChar = trimmedName.charAt(0);

  if (!isNaN(firstChar)) {
    return firstChar;
  }

  let nameParts = trimmedName.split(" ");

  if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase();
  }

  let firstInitial = nameParts[0].charAt(0).toUpperCase();
  let secondInitial = nameParts[1].charAt(0).toUpperCase();

  return firstInitial + secondInitial;
}

/** Closes overlays and resets the form. */
function closeOverlay(event) {
  if (event && event.target !== event.currentTarget) {
    return;
  }

  const overlayIds = [
    "contactAdd",
    "contactEdit",
    "contactDetails",
    "addTaskBoard",
    "infoOverlay",
    "editTaskOverlay",
  ];

  overlayIds.forEach((id) => {
    const overlay = document.getElementById(id);
    if (overlay && overlay.classList.contains("open")) {
      overlay.classList.remove("open");

      if (["contactAdd", "contactEdit", "contactDetails"].includes(id)) {
        resetContactForm(id);
      }
      if (id === "addTaskBoard") {
        clearAll();
      }
      if (id === "editTaskOverlay") {
        resetPriorityButtons();
      }
    }
  });

  const anyOverlayOpen = overlayIds.some((id) => {
    const o = document.getElementById(id);
    return o && o.classList.contains("open");
  });
  
  if (anyOverlayOpen) {
    document.body.classList.add("no-scroll");
  } else {
    document.body.classList.remove("no-scroll");
  }
}

/** Sets the minimum and maximum allowed date for the task input. Minimum is today's date, maximum is 5 years from today. */
function setMinDate() {
  const input = document.getElementById("addTaskDate");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yyyy = today.getFullYear(),
    mm = String(today.getMonth() + 1).padStart(2, "0"),
    dd = String(today.getDate()).padStart(2, "0");

  input.min = `${yyyy}-${mm}-${dd}`;
  input.max = `${yyyy + 5}-${mm}-${dd}`;
}

/** Validates the selected date in the task form. */
function validateDateInput() {
  const input = document.getElementById("addTaskDate");
  const today = new Date(); today.setHours(0,0,0,0);
  const selectedDate = new Date(input.value);
  const isManual = input.value && !input.value.includes("-");

  if (selectedDate < today && !isManual) {
    input.value = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  }

  if (isManual) document.getElementById("addTaskDateError").classList.add("d_none");
}
