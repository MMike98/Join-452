/** Loads tasks data, analyzes counts and nearest urgent due date, then renders the results. */
async function loadTasksAndCount() {
  try {
    let data = await fetchTasks();
    let { counts, nearestUrgentDate } = analyzeTasks(data);
    renderTaskCounts(counts, nearestUrgentDate);
  } catch (error) {
    console.error("Error loading tasks:", error);
  }
}

/** Fetches tasks data from the API endpoint. */
async function fetchTasks() {
  let response = await fetch(`${BASE_URL}/tasks.json`);
  return await response.json();
}

/** Validates if the task object has a valid status that we can count. */
function isValidTask(task, counts) {
  return (
    typeof task === "object" &&
    task !== null &&
    task.status &&
    counts.hasOwnProperty(task.status)
  );
}

/** Analyzes the tasks data to count tasks by status, count urgent tasks, and find the nearest due date among urgent tasks. */
function analyzeTasks(data) {
  let counts = {total: 0, to_do: 0, in_progress: 0, await_feedback: 0, done: 0, urgent: 0, };
  let urgentDueDates = [];

  Object.values(data).forEach(task => {
    if (!isValidTask(task, counts)) return;

    counts[task.status]++;
    counts.total++;

    if (task.priority === "Urgent") {
      counts.urgent++;
      if (task.duedate) urgentDueDates.push(new Date(task.duedate));
    }
  });

  return {
    counts,
    nearestUrgentDate: getNearestDate(urgentDueDates),
  };
}

/** Returns the earliest date from an array of dates or null if empty. */
function getNearestDate(dates) {
  if (dates.length === 0) return null;

  dates.sort((a, b) => a - b);
  return dates[0];
}

/** Renders task counts and the nearest urgent due date */
function renderTaskCounts(counts, nearestUrgentDate) {
  document.getElementById("countToDo").textContent = counts.to_do;
  document.getElementById("countInProgress").textContent = counts.in_progress;
  document.getElementById("countAwaitFeedback").textContent = counts.await_feedback;
  document.getElementById("countDone").textContent = counts.done;
  document.getElementById("countTotal").textContent = counts.total;
  document.getElementById("countUrgent").textContent = counts.urgent;
  document.getElementById("dateUrgent").textContent = formatDateLongUS(nearestUrgentDate);
}

/** Formats a Date object into "Month day, Year" or returns "–" if no date. */
function formatDateLongUS(date) {
  return date
    ? date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "–";
}

window.addEventListener("load", loadTasksAndCount);

//** Fades out and hides the greeting text in the mobile view */
setTimeout(function () {
  let summary = document.querySelector(".summary-right");
  if (summary) {
    summary.classList.add("fadeOut");
    setTimeout(() => {
      summary.classList.add("fadeOutHidden");
    }, 1000);
  }
}, 2000);

/** Displays the greeting and user name depending on the user role (guest/user) and time of day. */
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

/** Retrieves the full name of the user based on the email stored in localStorage. */
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

/** Determines the greeting based on the current hour of the day. */
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




