/**  Loads tasks data, analyzes counts and nearest urgent due date, then renders the results.
 * @async
 * @returns {Promise<void>} */
async function loadTasksAndCount() {
  try {
    let data = await fetchTasks();
    let { counts, nearestUrgentDate } = analyzeTasks(data);
    renderTaskCounts(counts, nearestUrgentDate);
  } catch (error) {
    console.error("Error loading tasks:", error);
  }
}

/** Fetches all tasks from the backend API.
 * @async
 * @returns {Promise<Object>} A promise that resolves to the tasks object. */
async function fetchTasks() {
  let response = await fetch(`${BASE_URL}/tasks.json`);
  return await response.json();
}

/** Validates if a task object has a valid status that can be counted.
 * @param {Object} task - The task object to validate.
 * @param {Object} counts - The object containing valid status keys.
 * @returns {boolean} True if the task is valid, false otherwise. */
function isValidTask(task, counts) {
  return (
    typeof task === "object" &&
    task !== null &&
    task.status &&
    counts.hasOwnProperty(task.status)
  );
}

/** Analyzes tasks data to count tasks by status, count urgent tasks, and find nearest urgent due date.
 * @param {Object} data - The object containing all tasks.
 * @returns {{ counts: Object, nearestUrgentDate: Date|null }} Task counts and nearest urgent due date. */
function analyzeTasks(data) {
  const counts = { total: 0, to_do: 0, in_progress: 0, await_feedback: 0, done: 0, urgent: 0 };
  const urgentDates = [];

  Object.values(data).forEach(t => {
    if (!isValidTask(t, counts)) return;
    counts[t.status]++; counts.total++;
    if (t.priority === "Urgent" && t.duedate) { counts.urgent++; urgentDates.push(new Date(t.duedate)); }
  });

  return { counts, nearestUrgentDate: getNearestDate(urgentDates) };
}

/** Returns the earliest date from an array of Date objects.
 * @param {Date[]} dates - Array of Date objects.
 * @returns {Date|null} The earliest date or null if array is empty. */
function getNearestDate(dates) {
  if (dates.length === 0) return null;

  dates.sort((a, b) => a - b);
  return dates[0];
}

/** Updates the DOM elements with task counts and the nearest urgent due date.
 * @param {Object} counts - Object containing counts of tasks per status.
 * @param {Date|null} nearestUrgentDate - The nearest due date of urgent tasks. */
function renderTaskCounts(counts, nearestUrgentDate) {
  document.getElementById("countToDo").textContent = counts.to_do;
  document.getElementById("countInProgress").textContent = counts.in_progress;
  document.getElementById("countAwaitFeedback").textContent = counts.await_feedback;
  document.getElementById("countDone").textContent = counts.done;
  document.getElementById("countTotal").textContent = counts.total;
  document.getElementById("countUrgent").textContent = counts.urgent;
  document.getElementById("dateUrgent").textContent = formatDateLongUS(nearestUrgentDate);
}

/** Formats a Date object into "Month day, Year" string.
 * @param {Date|null} date - The date to format.
 * @returns {string} Formatted date or "–" if date is null. */
function formatDateLongUS(date) {
  return date
    ? date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "–";
}

window.addEventListener("load", loadTasksAndCount);

/** Fades out and hides the greeting text in the mobile view */
setTimeout(function () {
  let summary = document.querySelector(".summary-right");
  if (summary) {
    summary.classList.add("fadeOut");
    setTimeout(() => {
      summary.classList.add("fadeOutHidden");
    }, 1000);
  }
}, 2000);

/** Displays the greeting and user name depending on role and time of day.
 * @async
 * @returns {Promise<void>} */
async function showGreetingAndName() {
  let userRole = localStorage.getItem("userRole");
  let greetingDisplay = document.getElementById("greetingDisplay");
  let userNameElement = document.getElementById("userNameDisplay");
  let greeting = getGreetingByTime();

  if (userRole === "guest") {
    greetingDisplay.textContent = greeting + "!";
    userNameElement.textContent = "";
  } else if (userRole === "user") {
    greetingDisplay.textContent = greeting + ",";
    let fullName = await getUserFullNameFromStorage();
    userNameElement.textContent = fullName || "";
  } 
}

/** Retrieves the full name of the logged-in user based on stored email.
 * @async
 * @returns {Promise<string|null>} Full name or null if not found. */
async function getUserFullNameFromStorage() {
  let email = localStorage.getItem("userEmail");

  let data = await getUserByEmail(email);
  let users = Object.values(data || {});
  let user = users[0];

  if (user && user.name) {
    return user.name;
  }
  return null;
}

/** Determines the greeting text based on current hour.
 * @returns {string} Greeting message: "Good morning", "Good afternoon", or "Good evening". */
function getGreetingByTime() {
  let now = new Date();
  let hour = now.getHours();

  if (hour >= 5 && hour < 12) {
    return "Good morning";
  } else if (hour >= 12 && hour < 18) {
    return "Good afternoon";
  } else {
    return "Good evening";
  }
}

/** Event listener: Run both functions when the page loads */
window.addEventListener("load", () => {
  showUserInitial();
  showGreetingAndName();
});




