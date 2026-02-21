/** Updates all task columns in the UI based on current task data. Filters tasks by status and optional search query.
 * @param {string} [query=""] - Optional search string to filter tasks. */
function updateHTML(query = "") {
  const statuses = ["to_do", "in_progress", "await_feedback", "done"];

  statuses.forEach((status) => {
    const tasksInStatus = Object.entries(task).filter(([_, t]) => t.status === status).filter(([_, t]) => taskMatchesQuery(t, query));

    updateColumn(status, tasksInStatus);
  });

  addCardClickHandlers();
}

/** Updates a single column with tasks of a given status.
 * @param {string} status - Task status corresponding to the column ID.
 * @param {Array} tasks - Array of [key, task] pairs to render in the column. */
function updateColumn(status, tasks) {
  const column = document.getElementById(status);
  column.innerHTML = tasks.length
    ? tasks.map(([key, t]) => generateTaskHTML(t, key, getCategoryClass(t.category))).join("")
    : generateEmptyColumnHTML(status);
}

/** Returns the fallback HTML for empty task columns.
 * @param {string} status - Current column status.
 * @returns {string} HTML string for empty column. */
function generateEmptyColumnHTML(status) {
  const statusMessages = {
    to_do: "No tasks To Do",
    in_progress: "No tasks In Progress",
    await_feedback: "No tasks Await Feedback",
    done: "No tasks Done",
  };

  return emptyColumnTemplate(statusMessages[status]);
}

/** Generates HTML for assigned users with colored circles.
 * Shows a maximum of 4 users and adds "+X" if more exist.
 * @param {string[]} assigned - Array of assigned user names.
 * @returns {string} HTML string of user circles. */
function generateAssignedUsers(assigned) {
  if (!Array.isArray(assigned) || !assigned.length) return "";

  const maxVisible = 4;
  let html = "";

  const visibleUsers = assigned.slice(0, maxVisible);
  visibleUsers.forEach(name => {html += userCircleHTML(name, getColorForName(name));
  });

  const remaining = assigned.length - maxVisible;
  if (remaining > 0) html += userCircleHTML(`+${remaining}`, "black");

  return html;
}

/** Renders assigned users as profile icons in the edit overlay.
 * @param {string[]} assigned - Array of assigned user names. */
function renderAssignedEdit(assigned) {
  const container = document.getElementById("editAssignedUsers");
  if (!container) return;

  container.innerHTML = "";

  if (!assigned || !Array.isArray(assigned) || assigned.length === 0) return;

  container.innerHTML = assigned
    .map((name) => {
      let initials = getInitials(name);
      let color = getColorForName(name);
      return `<div class="profile-icon" style="background-color:${color}">${initials}</div>`;
    })
    .join("");
}

/** Renders the contact dropdown in the edit task overlay. Uses editGlobalContacts and editSelected state arrays. */
function renderEditContactDropdown() {
  const dropdown = document.getElementById("editTaskContactDropDown");
  if (!dropdown || !editGlobalContacts) return;

  dropdown.innerHTML = "";
  editGlobalContacts.forEach((contact, i) => {
    const label = document.createElement("label");
    label.id = `editContactLabel-${i}`;
    label.classList.add("contact-item");
    label.style.display = "flex";
    label.style.justifyContent = "space-between";
    label.style.alignItems = "center";
    label.style.padding = "5px 10px";
    label.style.cursor = "pointer";

    label.innerHTML = editContactInnerHTML(contact, editSelected[i] === 1);

    label.addEventListener("mouseenter", () => label.style.backgroundColor = "#f0f0f0");
    label.addEventListener("mouseleave", () => label.style.backgroundColor = "transparent");
    label.addEventListener("click", () => toggleEditSelection(i));

    dropdown.appendChild(label);
  });
}

/** Renders selected contact circles in the edit overlay. Displays max 4 circles and shows "+X" if more selected. */
function renderEditContactCircles() {
  const c = document.getElementById("editTaskContactsSelected");
  if (!c) return;

  const selected = editGlobalContacts.filter((_, i) => editSelected[i] === 1);
  const visible = selected.slice(0, 4);
  c.innerHTML = visible.map(editContactCircleHTML).join("");
  if (selected.length > 4) c.innerHTML += `<span class="circle circleEdit more" style="background-color:black">+${selected.length-4}</span>`;
}

/** Checks if a task matches a search query in title, description, subtasks, or assigned users.
 * @param {Object} task - Task object containing title, description, subtasks, subtasksDone, assigned.
 * @param {string} query - Search string to match against.
 * @returns {boolean} True if the task matches the query. */
function taskMatchesQuery(task, query) {
  if (!query) return true;
  query = query.toLowerCase();
  return [task.title, task.description, ...(task.subtasks || []), ...(task.subtasksDone || []), ...(task.assigned || [])].some(v => v.toLowerCase().includes(query));
}

/** Returns CSS class name based on task category.
 * @param {string} category - Task category.
 * @returns {string} CSS class name. */
function getCategoryClass(category) {
  if (!category) return "default";

  switch (category.toLowerCase().trim()) {
    case "user story":
      return "blue";
    case "technical task":
      return "green";
    default:
      return "default";
  }
}

/** Returns a color string for a contact name. Uses contactIndexMap to determine color index.
 * @param {string} name - Contact name.
 * @returns {string} Color string. */
function getColorForName(name) {
  let index = contactIndexMap[name] ?? 0;
  return circleColors[index % circleColors.length];
}

/** Generates HTML for a user circle with initials.
 * @param {string} name - Full name of the user.
 * @returns {string} HTML string for user circle. */
function generateAssignedUserCircle(name) {
  const initials = name.split(" ").map((n) => n[0]?.toUpperCase()).join("").slice(0, 2);
  return `<div class="user-circle">${initials}</div>`;
}

/** Renders task information inside the info overlay.
 * @param {Object} t - Task object.
 * @param {string} key - Task key. */
function renderInfoTask(t, key) {
  let overlay = document.getElementById("infoOverlay");
  let infoTask = document.getElementById("infoTask");
  if (!overlay || !infoTask || !t) return;

  infoTask.innerHTML = generateInfoTaskHTML(t, key);
  overlay.classList.add("open");

  document.body.classList.add("no-scroll");
}

/** Renders active and completed subtasks in edit overlay. */
function renderEditSubtasks() {
  const list = document.getElementById("editSubtaskList");
  if (!list) return;

  if (editSubtasks.length === 0 && editSubtasksDone.length === 0) return list.classList.add("d_none");
  list.classList.remove("d_none");

  list.innerHTML =
    editSubtasks.map(activeSubtaskTemplate).join("") +
    editSubtasksDone.map(doneSubtaskTemplate).join("");
}

/** Toggles the visibility of the contacts dropdown in the edit task overlay. */
function toggleEditDropdown() {
  const input = document.getElementById("editTaskContacts");
  const dropdown = document.getElementById("editContactsDropdown");

  if (!input || !dropdown) return;

  dropdown.classList.toggle("d_none");
  input.classList.toggle("dropdownOpen");
}

/** Toggles the visibility of the subtask input icons in the edit overlay. Shows the confirm icon only when the subtask input is not empty. */
function toggleEditSubtaskIcons() {
  const input = document.getElementById("editSubtaskInput");
  const icons = document.getElementById("editSubtaskConfirm");

  if (input.value.trim().length > 0) {
    icons.classList.remove("d_none");
  } else {
    icons.classList.add("d_none");
  }
}

/** Opens the Add-Task slider with animation and initializes its content.
 * @returns {Promise<void>} */
async function openAddTaskSlider() {
  const slider = document.getElementById("addTaskSlider");
  const panel = slider.querySelector(".overlay");

  slider.classList.remove("d_none");

  requestAnimationFrame(() => {
    slider.classList.add("active");
    panel.classList.add("open");
  });

  await initAddTaskSlider();
}

/** Closes the Add-Task slider with animation.
 * @param {Event} event - Triggering event. */
function closeAddTaskSlider(event) {
  const slider = document.getElementById("addTaskSlider");
  const panel = slider.querySelector(".overlay");

  panel.classList.remove("open");
  slider.classList.remove("active");

  setTimeout(() => {
    slider.classList.add("d_none");
  }, 350);
}

/** Opens Overlay for AddTask */
function openAddTaskOverlay() {
  if (window.innerWidth < 1400) {
    window.location.href = "addtask.html";
    return;
  }

  const overlay = document.getElementById("addTaskBoard");
  if (!overlay) return;

  overlay.classList.add("open");
  document.body.classList.add("no-scroll");
  init();
}

/** Adds click event handlers to task cards to render their info in the overlay. */
function addCardClickHandlers() {
  Object.entries(task).forEach(([key, t]) => {
    let card = document.getElementById(`card-${key}`);
    if (card) {
      card.addEventListener("click", () => renderInfoTask(t, key));
    }
  });
}

/** Toggles visibility of a dropdown element by ID.
 * @param {string} id - ID of dropdown element. */
function toggleDropdownById(id) {
  const dropdown = document.getElementById(id);
  if (!dropdown) return;
  dropdown.classList.toggle("d_none");
}