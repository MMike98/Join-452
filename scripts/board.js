let currentDraggedElement;
let task = {};
let contactIndexMap = {};

/** Initializes the board by fetching tasks and contacts, building the contact index map, and updating the HTML. */
async function initBoard() {
  task = await fetchTasks();

  let contacts = await fetchContacts();
  currentUser = await fetchCurrentUser();
  console.log(currentUser);

  buildContactIndexMap(contacts);
  setupSearch();
  updateHTML();
  setupDropzoneHighlight();
}

/** Builds a map from contact names to indices based on sorted first names. Filters invalid contacts and returns sorted array. */
function buildContactIndexMap(contacts) {
  let contactsArray = Array.isArray(contacts)
    ? contacts
    : Object.values(contacts);
  let validContacts = contactsArray.filter(
    (c) => c.name && typeof c.name === "string"
  );

  let sortedContacts = validContacts.sort((a, b) => {
    let firstNameA = a.name.split(" ")[0].toLowerCase();
    let firstNameB = b.name.split(" ")[0].toLowerCase();
    return firstNameA.localeCompare(firstNameB);
  });

  contactIndexMap = {};
  sortedContacts.forEach((contact, index) => {
    contactIndexMap[contact.name] = index;
  });

  return sortedContacts;
}

/** Updates all task columns in the UI based on current task data. */
function updateHTML(query = "") {
  const statuses = ["to_do", "in_progress", "await_feedback", "done"];

  statuses.forEach((status) => {
    const tasksInStatus = Object.entries(task)
      .filter(([_, t]) => t.status === status)
      .filter(([_, t]) => {
        if (!query) return true;
        return t.title?.toLowerCase().includes(query.toLowerCase());
      });

    updateColumn(status, tasksInStatus);
  });

  addCardClickHandlers();
}

/** Updates a single column based on its task status. */
function updateColumn(status, tasks) {
  const column = document.getElementById(status);
  column.innerHTML = "";

  if (tasks.length === 0) {
    column.innerHTML = generateEmptyColumnHTML(status);
    return;
  }

  for (const [key, t] of tasks) {
    const categoryClass = getCategoryClass(t.category);
    column.innerHTML += generateTaskHTML(t, key, categoryClass);
  }
}

/** Returns the fallback "no tasks" HTML used for all empty columns. */
function generateEmptyColumnHTML(status) {
  const statusMessages = {
    to_do: "No tasks To Do",
    in_progress: "No tasks In Progress",
    await_feedback: "No tasks Await Feedback",
    done: "No tasks Done",
  };

  return `
    <div class="no-task">
      <p>${statusMessages[status]}</p>
    </div>
  `;
}

/** Starts dragging a task. */
function startDragging(id) {
  currentDraggedElement = id;
}

/** Allows drop by preventing default event. */
function allowDrop(ev) {
  ev.preventDefault();
}

/** Moves the currently dragged task to a new status and updates Firebase. */
async function moveTo(status, key) {
  task[key]["status"] = status;

  try {
    await updateFirebase(key, status);
  } catch (error) {
    console.error("Error updating status in Firebase:", error);
  }

  updateHTML();

  requestAnimationFrame(() => {
    let newCard = document.getElementById(`card-${key}`);
    if (newCard) {
      newCard.classList.add("wiggle");
      newCard.addEventListener(
        "animationend",
        () => {
          newCard.classList.remove("wiggle");
        },
        { once: true }
      );
    }
  });
}

/** Handles drop event to move task to new status. */
// function drop(ev, newStatus) {
// ev.preventDefault();
//  moveTo(newStatus);
// }

function drop(ev, newStatus) {
  ev.preventDefault();

  const card = document.getElementById(`card-${currentDraggedElement}`);
  if (!card) return;

  const key = card.dataset.key;
  moveTo(newStatus, key);
}

/** Updates the task status in Firebase. */
async function updateFirebase(taskId, newStatus) {
  let url = `${BASE_URL}/tasks/${taskId}.json`;
  let payload = { status: newStatus };

  try {
    await fetch(url, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    console.log(`Status for Task ${taskId} updated to '${newStatus}'.`);
  } catch (error) {
    console.error("Error updating Firebase:", error);
    throw error;
  }
}

/** Returns CSS class for a given task category. */
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

/** Generates HTML for assigned users with color-coded initials. */
function generateAssignedUsers(assigned) {
  if (!assigned || !Array.isArray(assigned)) return "";

  const validUsers = assigned.filter(
    (name) => typeof name === "string" && name.trim() !== ""
  );

  const maxVisible = 4;
  const visibleUsers = validUsers.slice(0, maxVisible);
  const remaining = validUsers.length - maxVisible;

  let html = visibleUsers
    .map((name) => {
      let initials = getInitials(name);
      let color = getColorForName(name);
      return `
      <div class="profile-icon" style="background-color: ${color}">
        ${initials}
      </div>
    `;
    })
    .join("");

  if (remaining > 0) {
    html += `
      <div class="profile-icon" style="background-color: black">
        +${remaining}
      </div>
    `;
  }

  return html;
}

/** Returns a color string for a contact name based on its index in contactIndexMap. */
function getColorForName(name) {
  let index = contactIndexMap[name] ?? 0;
  return circleColors[index % circleColors.length];
}

/** Returns the file path for a priority icon image. */
function dynamicPriorityIcon(priority) {
  let formatted =
    priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
  return `../assets/icons/Priority ${formatted}.svg`;
}

/** Sets up the search input to filter tasks as the user types. */
function setupSearch() {
  const input = document.getElementById("searchBoard");
  if (!input) return;

  input.addEventListener("input", (event) => {
    currentQuery = event.target.value.trim().toLowerCase();
    updateHTML(currentQuery);
  });
}

/**
 * Öffnet den Add-Task-Slider und initialisiert ihn. */
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

/**  Schließt den Add-Task-Slider mit Animation. */
function closeAddTaskSlider(event) {
  const slider = document.getElementById("addTaskSlider");
  const panel = slider.querySelector(".overlay");

  panel.classList.remove("open");
  slider.classList.remove("active");

  setTimeout(() => {
    slider.classList.add("d_none");
  }, 350);
}

/** Behandelt das Erstellen einer neuen Aufgabe, speichert sie und schließt den Slider. */
async function handleCreateTask(event) {
  try {
    await saveNewTask(event);
  } catch (err) {
    console.error(err);
  } finally {
    closeAddTaskSlider(event);
  }

  setTimeout(() => {
    window.location.href = "./board.html";
  }, 800);
}

/**  Initialisiert den Add-Task-Slider, lädt Kontakte, Kategorien und rendert die ausgewählten Kontakte.  */
async function initAddTaskSlider() {
  clearAll();
  showUserInitial();
  let contacts = await loadContactsIntoDropdown();
  console.log("contacts in initAddTaskSlider:", contacts);
  setupClickHandler();
  await loadCategoriesIntoDropdown();
  renderSelectedContactCircles(contacts);
}

/** Opens Overlay for AddTask */
function openAddTaskOverlay() {
  if (window.innerWidth >= 1400) {
    let overlay = document.getElementById("addTaskBoard");
    if (overlay) {
      overlay.classList.add("open");
      init();
    }
  } else {
    window.location.href = "addtask.html";
  }
}

/** Saves new Task (Task added via Overlay on Board) */
async function saveNewTaskOverlay(event) {
  event.preventDefault();

  let { title, description, duedate, category, priority, assigned, subtasks } =
    getTaskInformation();

  if (!required(event)) return;

  let newId = await getNextTaskId();

  let newTask = {
    title,
    description,
    duedate,
    category,
    priority,
    assigned,
    subtasks,
    id: newId,
    status: "to_do",
  };

  await loadTaskIntoAPI(newTask);

  task = await fetchTasks();

  clearAll();
  closeOverlay();
  updateHTML();
}

/** Prevents the overlay click from closing the dropdowns when the user interacts with elements inside the dropdowns. */
document.addEventListener("DOMContentLoaded", function () {
  let boardAddTask = document.getElementById("boardAddTask");
  if (boardAddTask) {
    boardAddTask.addEventListener("click", function (event) {
      let dropdowns = ["contacts", "category"];
      let clickedInsideDropdown = dropdowns.some((id) => {
        let dropdown = document.getElementById(id);
        return dropdown && dropdown.contains(event.target);
      });

      if (clickedInsideDropdown) {
        event.stopPropagation();
      }
    });
  } else {
    console.warn("Element with ID 'boardAddTask' not found.");
  }
});

/** Sets up visual feedback for drag-and-drop operations on task columns. */
function setupDropzoneHighlight() {
  const columnIds = ["to_do", "in_progress", "await_feedback", "done"];
  const overCounters = new WeakMap();

  columnIds.forEach((id) => {
    const col = document.getElementById(id);

    overCounters.set(col, 0);

    col.addEventListener("dragenter", (e) => {
      overCounters.set(col, overCounters.get(col) + 1);
      col.classList.add("drop-target");
    });

    col.addEventListener("dragleave", () => {
      const n = overCounters.get(col) - 1;
      overCounters.set(col, n);
      if (n <= 0) {
        col.classList.remove("drop-target");
        overCounters.set(col, 0);
      }
    });

    col.addEventListener("drop", () => {
      col.classList.remove("drop-target");
      overCounters.set(col, 0);
    });
  });
}

/** Renders the information of a task inside the overlay and makes it visible. */
function renderInfoTask(t, key) {
  let overlay = document.getElementById("infoOverlay");
  let infoTask = document.getElementById("infoTask");
  if (!overlay || !infoTask || !t) return;

  infoTask.innerHTML = generateInfoTaskHTML(t, key);

  overlay.classList.add("open");
}

/** Opens the info overlay by adding the 'open' class.*/
function openInfoOverlay() {
  let overlay = document.getElementById("infoOverlay");
  if (overlay) {
    overlay.classList.add("open");
  }
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

//** Change format of date */
function formatDate(dateString) {
  if (!dateString) return "";

  let [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}



function generateAssignedUserCircle(name) {
  const initials = name
    .split(" ")
    .map((n) => n[0]?.toUpperCase())
    .join("")
    .slice(0, 2); // Nur die ersten 2 Buchstaben
  return `<div class="user-circle">${initials}</div>`;
}

async function DeleteTask(key) {
  try {

    if (!confirm("Are you sure you want to delete this task?")) return;

    const url = `${BASE_URL}/tasks/${key}.json`;
    
    await fetch(url, { method: "DELETE" });

    if (task && typeof task === "object") {
    delete task[key];
    }

    closeOverlay?.();
    updateHTML();

  } catch (err) {
    console.error(err);
    alert("Could not delete the task. Please try again.");
  }
}


function editTask(key) {
  return `editTask('${key}')`;
}

async function toggleSubtask(key, subtaskTitle, isChecked) {
  try {
    if (!task[key]) return;

    task[key].subtasks = task[key].subtasks || [];
    task[key].subtasksDone = task[key].subtasksDone || [];

    task[key].subtasks = task[key].subtasks.filter(s => (s.title || s) !== subtaskTitle);
    task[key].subtasksDone = task[key].subtasksDone.filter(s => (s.title || s) !== subtaskTitle);

    if (isChecked) {
      task[key].subtasksDone.push(subtaskTitle);
    } else {
      task[key].subtasks.push(subtaskTitle);
    }

    const url = `${BASE_URL}/tasks/${key}.json`;
    await fetch(url, {
      method: "PATCH",
      body: JSON.stringify({
        subtasks: task[key].subtasks,
        subtasksDone: task[key].subtasksDone
      }),
    });

    renderInfoTask(task[key], key);
    updateHTML();

  } catch (err) {
    console.error("Error toggling subtask:", err);
    alert("Could not update subtask. Please try again.");
  }
}

function isYou(name) {
  return (
    !!currentUser &&
    typeof name === "string" &&
    name.trim().toLowerCase() === currentUser.trim().toLowerCase()
  );
}