const BASE_URL = "https://join-gruppenarbeit-a540b-default-rtdb.europe-west1.firebasedatabase.app";

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

/** Toggles the visibility of the dropdown menu. */
function toggleDropdown() {
  document.getElementById("myDropdown").style.display = "block";
}

/** Fetches the current user's name from localStorage or backend, defaults to "Guest".
 * @returns {Promise<string>} The user's name or "Guest" if not available. */
async function fetchCurrentUser() {
  const email = localStorage.getItem("userEmail");
  if (localStorage.getItem("userRole") === "guest" || !email) return "Guest";

  try {
    const userData = await getUserByEmail(email);
    const user = userData ? Object.values(userData)[0] : null;
    return user?.name || "Guest";
  } catch {
    return "Guest";
  }
}

/** Fetches a user from Firebase by email.
 * @param {string} email - The email of the user.
 * @returns {Promise<Object>} The user data from Firebase. */
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

/** Fetches contacts from Firebase.
 * @returns {Promise<Object>} The contacts data from Firebase. */
async function fetchContacts() {
  let url = `${BASE_URL}/contacts.json`;
  let response = await fetch(url);
  let contacts = await response.json();
  return contacts;
}

/** Fetches tasks from Firebase.
 * @returns {Promise<Object>} The tasks data from Firebase. */
async function fetchTasks() {
  const url = `${BASE_URL}/tasks.json`;
  const response = await fetch(url);
  const tasks = await response.json();
  return tasks;
}

/** Returns the initials of a name (first two letters of first and last word, or first character if numeric/single word).
 * @param {string} name - The full name of the user.
 * @returns {string} Initials in uppercase. */
function getInitials(name) {
  if (!name) return "";
  const parts = name.trim().split(" ");
  const first = parts[0].charAt(0).toUpperCase();
  const second = parts[1]?.charAt(0).toUpperCase() || "";
  return isNaN(first) ? first + second : first;
}

/** Closes all open overlays and resets the form if necessary.
 * @param {Event} [event] - The click event that triggered the overlay close. */
function closeOverlay(event) {
  if (event && event.target !== event.currentTarget) return;

  const overlayIds = [
    "contactAdd", "contactEdit", "contactDetails", 
    "addTaskBoard", "infoOverlay", "editTaskOverlay"
  ];

  overlayIds.forEach((id) => {
    const overlay = document.getElementById(id);
    if (overlay?.classList.contains("open")) {
      overlay.classList.remove("open");
      if (id === "addTaskBoard") clearBoardOverlay();
      if (id === "editTaskOverlay") resetPriorityButtons();
      if (["contactAdd", "contactEdit", "contactDetails"].includes(id)) resetContactForm(id);
    }
  });

  document.body.classList.toggle("no-scroll", overlayIds.some(id => document.getElementById(id)?.classList.contains("open")));
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

/** Change the format of the date (from YYYY-MM-DD to DD/MM/YYYY).
 * @param {string} dateString - The date string in YYYY-MM-DD format.
 * @returns {string} The formatted date string in DD/MM/YYYY format. */
function formatDate(dateString) {
  if (!dateString) return "";

  let [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}