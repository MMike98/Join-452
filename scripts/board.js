let currentDraggedElement;
let task = {};
let contactIndexMap = {};
let editGlobalContacts = [];
let editSelected = []; 
let editSelectedPriority = null;
let editSubtasks = [];
let editSubtasksDone = [];

/** Initializes the board by fetching tasks and contacts, building the contact index map, and updating the HTML. */
async function initBoard() {
  task = await fetchTasks();

  let contacts = await fetchContacts();
  currentUser = await fetchCurrentUser();

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

  document.body.classList.add("no-scroll");
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

  document.body.classList.add("no-scroll");
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

function isYou(name) {
  return (
    !!currentUser &&
    typeof name === "string" &&
    name.trim().toLowerCase() === currentUser.trim().toLowerCase()
  );
}

/** Handles (un)checking of a subtask and updates Firebase + UI. */
async function toggleSubtask(taskKey, subtaskTitle, isChecked) {
  try {
    if (!task[taskKey]) {
      console.warn(`Task not found for key: ${taskKey}`);
      return;
    }

    const t = task[taskKey];

    if (!Array.isArray(t.subtasks)) t.subtasks = [];
    if (!Array.isArray(t.subtasksDone)) t.subtasksDone = [];

    if (isChecked) {
      if (!t.subtasksDone.includes(subtaskTitle)) {
        t.subtasksDone.push(subtaskTitle);
      }
      t.subtasks = t.subtasks.filter((s) => s !== subtaskTitle);
    } 

    else {
      if (!t.subtasks.includes(subtaskTitle)) {
        t.subtasks.push(subtaskTitle);
      }
      t.subtasksDone = t.subtasksDone.filter((s) => s !== subtaskTitle);
    }

    await fetch(`${BASE_URL}/tasks/${taskKey}.json`, {
      method: "PATCH",
      body: JSON.stringify({
        subtasks: t.subtasks,
        subtasksDone: t.subtasksDone,
      }),
    });

    updateHTML();

  } catch (error) {
    console.error("Error toggling subtask:", error);
  }
}

/** Deletes a task from Firebase and updates the board */
async function DeleteTask(taskKey) {
  if (!taskKey) {
    console.error("DeleteTask: No task key provided");
    return;
  }

  try {
    const url = `${BASE_URL}/tasks/${taskKey}.json`;
    const response = await fetch(url, { method: "DELETE" });

    if (!response.ok) {
      throw new Error(`Failed to delete task ${taskKey}`);
    }

    delete task[taskKey];

    updateHTML();
    closeOverlay();

  } catch (error) {
    console.error("Error deleting task:", error);
  }
}

/** Opens the edit task overlay and fills in the task's details. */
async function editTask(key) {
    closeOverlay(); 
    const t = task[key];
    if (!t) return;

    document.getElementById("editTaskKey").value = key;
    document.getElementById("editTitle").value = t.title || "";
    document.getElementById("editDescription").value = t.description || "";
    document.getElementById("editDueDate").value = t.duedate || "";
    setPriorityEdit(t.priority || 'low');

    await loadEditContacts(t.assigned || []);

    editSubtasks = [...(t.subtasks || [])];
    editSubtasksDone = [...(t.subtasksDone || [])];

    renderEditSubtasks();

    const overlay = document.getElementById("editTaskOverlay");
    overlay.classList.remove("d_none");
    overlay.classList.add("open");
    document.body.classList.add("no-scroll");
}

/** Activates a priority button and updates the UI in the edit overlay. */
function activateEdit(priority) {
    const priorities = ['urgent', 'medium', 'low'];

    priorities.forEach(p => {
        const btn = document.getElementById(p + 'EditBtn');
        if (!btn) return;

        btn.classList.remove('urgent', 'medium', 'low');

        const activeIcon = document.getElementById(p + 'ActiveEdit');
        const notActiveIcon = document.getElementById(p + 'NotActiveEdit');
        if (activeIcon) activeIcon.classList.add('d_none');
        if (notActiveIcon) notActiveIcon.classList.remove('d_none');
    });

    const activeBtn = document.getElementById(priority + 'EditBtn');
    if (activeBtn) {
        activeBtn.classList.add(priority);
    }

    const activeIcon = document.getElementById(priority + 'ActiveEdit');
    const notActiveIcon = document.getElementById(priority + 'NotActiveEdit');
    if (activeIcon) activeIcon.classList.remove('d_none');
    if (notActiveIcon) notActiveIcon.classList.add('d_none');
}

/** Sets the task priority in the edit overlay and updates button states. */
function setPriorityEdit(priority) {
    if (!priority) priority = 'low';
    priority = priority.toLowerCase();

    ['urgent', 'medium', 'low'].forEach(p => {
        const btn = document.getElementById(p + 'EditBtn');
        const active = document.getElementById(p + 'ActiveEdit');
        const notActive = document.getElementById(p + 'NotActiveEdit');
        if (btn) btn.classList.remove('urgent', 'medium', 'low');
        if (active) active.classList.add('d_none');
        if (notActive) notActive.classList.remove('d_none');
    });

    const activeBtn = document.getElementById(priority + 'EditBtn');
    const activeIcon = document.getElementById(priority + 'ActiveEdit');
    const notActiveIcon = document.getElementById(priority + 'NotActiveEdit');

    if (activeBtn) {
        activeBtn.classList.add(priority);
    }
    if (activeIcon) {
        activeIcon.classList.remove('d_none');
    }
    if (notActiveIcon) {
        notActiveIcon.classList.add('d_none');
    }

    const overlay = document.getElementById('editTaskOverlay');
    if (overlay) {
        overlay.dataset.priority = priority;
    }
}

/** Saves the edited task data to the backend (e.g., Firebase). */
async function saveEditedTask() {
    const key = document.getElementById("editTaskKey").value;
    if (!key) return;

    const overlay = document.getElementById('editTaskOverlay');
    const priority = overlay ? overlay.dataset.priority : 'low';

    const title = document.getElementById("editTitle").value.trim();
    const description = document.getElementById("editDescription").value.trim();
    const dueDate = document.getElementById("editDueDate").value.trim();
    const assignedUsers = getSelectedAssignedUsers();

    if (!title || !description) {
        console.warn("Title and description are required.");
        return;
    }

    const updatedTask = {
        title: title,
        description: description,
        duedate: dueDate,
        priority: priority,
        assigned: assignedUsers,
        subtasks: editSubtasks,
        subtasksDone: editSubtasksDone
    };

    try {
        const response = await fetch(`${BASE_URL}/tasks/${key}.json`, {
            method: "PATCH",
            body: JSON.stringify(updatedTask),
        });

        if (!response.ok) {
            throw new Error(`Error saving task. Status: ${response.status}`);
        }

        Object.assign(task[key], updatedTask);

        closeOverlay();
        updateHTML();
    } catch (error) {
        console.error("Error saving edited task:", error);
    }
}

/** Returns the list of selected assigned users for the task. */
function getSelectedAssignedUsers() {
    const selectedContacts = [];

    editGlobalContacts.forEach((contact, i) => {
        if (editSelected[i] === 1) {
            selectedContacts.push(contact.name);
        }
    });

    return selectedContacts;
}

/** Resets all priority buttons in the edit overlay to inactive. */
function resetPriorityButtons() {
    const priorities = ['urgent', 'medium', 'low'];

    priorities.forEach(p => {
        const btn = document.getElementById(p + 'EditBtn');
        if (!btn) return;

        btn.classList.remove('urgent', 'medium', 'low');

        const activeIcon = document.getElementById(p + 'ActiveEdit');
        const notActiveIcon = document.getElementById(p + 'NotActiveEdit');
        if (activeIcon) activeIcon.classList.add('d_none');
        if (notActiveIcon) notActiveIcon.classList.remove('d_none');
    });
}

/** Renders assigned users as profile icons in the edit overlay. */
function renderAssignedEdit(assigned) {
    const container = document.getElementById('editAssignedUsers');
    if (!container) return;

    container.innerHTML = '';

    if (!assigned || !Array.isArray(assigned) || assigned.length === 0) return;

    container.innerHTML = assigned.map(name => {
        let initials = getInitials(name);
        let color = getColorForName(name);
        return `<div class="profile-icon" style="background-color:${color}">${initials}</div>`;
    }).join('');
}

/** Opens the edit task overlay and fills in all task details. */
function openEditTaskOverlay(task) {
    if (!task) return;

    document.getElementById('editTaskKey').value = task.id;
    document.getElementById('editTitle').value = task.title || "";
    document.getElementById('editDescription').value = task.description || "";
    document.getElementById('editDueDate').value = task.duedate || "";

    setPriorityEdit(task.priority || 'low');

    loadEditContacts(task.assigned || []);
    renderSubtasksEdit(task.id);

    const overlay = document.getElementById('editTaskOverlay');
    overlay.classList.remove('d_none');
    overlay.classList.add('open');
    document.body.classList.add('no-scroll');
}

/** Activates a priority button in the edit overlay. */
function activateEditPriority(priority) {
    let priorities = ["urgent", "medium", "low"];
    editSelectedPriority = priority.toLowerCase();

    priorities.forEach((prio) => {
        let button = document.getElementById("edit-" + prio);
        let notActiveImg = document.getElementById("edit-" + prio + "NotActive");
        let activeImg = document.getElementById("edit-" + prio + "Active");
        let isActive = prio === editSelectedPriority;

        notActiveImg.classList.toggle("d_none", isActive);
        activeImg.classList.toggle("d_none", !isActive);
        button.classList.toggle(prio, isActive);
    });
}

/** Loads contacts for the edit overlay and marks selected ones. */
async function loadEditContacts(selectedAssigned) {
    const contactsData = await fetchContacts();
    let contactsArray = Array.isArray(contactsData)
        ? contactsData
        : Object.values(contactsData || {});

    let validContacts = contactsArray.filter(c => c && c.name && typeof c.name === "string");
    validContacts.sort((a, b) => a.name.split(" ")[0].toLowerCase().localeCompare(b.name.split(" ")[0].toLowerCase()));

    editGlobalContacts = validContacts;

    editSelected = validContacts.map(c =>
        selectedAssigned.some(name => name.trim().toLowerCase() === c.name.trim().toLowerCase()) ? 1 : 0
    );

    renderEditContactDropdown();
    renderEditContactCircles();
}

/** Creates labels for contacts in the edit overlay dropdown. */
function createEditContactLabels(contacts) {
    const dropdown = document.getElementById("editTaskContactDropDown");
    if (!dropdown) return;

    dropdown.innerHTML = "";

    contacts.forEach((contact, index) => {
        let color = circleColors[index % circleColors.length];
        const label = document.createElement("label");
        label.id = `editContactLabel-${index}`;
        label.className = editSelected[index] === 1 ? "contactSelected" : "";
        label.innerHTML = `
            <div class="contact-item">
                <span class="circle" style="background-color:${color}">${getInitials(contact.name)}</span>
                ${contact.name}
            </div>
        `;
        
        dropdown.appendChild(label);
    });
}

/** Renders the contact dropdown in the edit overlay. */
function renderEditContactDropdown() {
    const dropdown = document.getElementById("editTaskContactDropDown");
    if (!dropdown || !editGlobalContacts) return;
    dropdown.innerHTML = "";

    editGlobalContacts.forEach((contact, i) => {
        const label = document.createElement("label");
        label.id = `editContactLabel-${i}`;
        label.className = editSelected[i] === 1 ? "contactSelected" : "";
        label.innerHTML = `
            <div class="contact-item">
                <span class="circle" style="background-color:${getColorForName(contact.name)}">
                    ${getInitials(contact.name)}
                </span>
                ${contact.name}
            </div>
        `;
        label.onclick = () => toggleEditSelection(i);
        dropdown.appendChild(label);
    });
}

/** Toggles the selection of a contact in the edit overlay. */
function toggleEditSelection(index) {
    editSelected[index] = editSelected[index] === 1 ? 0 : 1;
    const label = document.getElementById(`editContactLabel-${index}`);
    if (label) label.classList.toggle("contactSelected", editSelected[index] === 1);

    renderEditContactCircles();
}

/** Renders the selected contact circles in the edit overlay. */
function renderEditContactCircles() {
    const container = document.getElementById("editTaskContactsSelected");
    if (!container) return;

    container.innerHTML = "";
    const selectedContacts = editGlobalContacts.filter((c, i) => editSelected[i] === 1);

    selectedContacts.forEach(contact => {
        const circle = document.createElement("span");
        circle.className = "circle";
        circle.textContent = getInitials(contact.name);
        circle.style.backgroundColor = getColorForName(contact.name);
        container.appendChild(circle);
    });

    container.classList.toggle("d_none", selectedContacts.length === 0);
}

/** Renders the list of subtasks in the edit task overlay, showing both active and completed subtasks. */
function renderEditSubtasks() {
    const list = document.getElementById("editSubtaskList");
    if (!list) return;

    list.innerHTML = "";

    editSubtasks.forEach((subtask, index) => {
        list.innerHTML += `
            <li class="edit-subtask-item">
                <span>${subtask}</span>
                <img src="../assets/icons/delete.svg"
                     onclick="deleteEditSubtask(${index})">
            </li>
        `;
    });

    editSubtasksDone.forEach((subtask, index) => {
        list.innerHTML += `
            <li class="edit-subtask-item completed">
                <span>${subtask}</span>
                <img src="../assets/icons/delete.svg"
                     onclick="deleteEditSubtaskDone(${index})">
            </li>
        `;
    });

    if (editSubtasks.length === 0 && editSubtasksDone.length === 0) {
        list.innerHTML = "<li class='no-subtasks'>No subtasks</li>";
    }
}

/** Toggles the completion status of a subtask. Moves a subtask between "active" and "completed" lists. */
function toggleEditSubtask(index, isDone) {
    if (isDone) {
        const subtask = editSubtasks.splice(index, 1)[0];
        editSubtasksDone.push(subtask);
    } else {
        const subtask = editSubtasksDone.splice(index, 1)[0];
        editSubtasks.push(subtask);
    }
    renderEditSubtasks();
}

/** Toggles the visibility of a dropdown menu by its ID. */
function toggleDropdownById(id) {
    const dropdown = document.getElementById(id);
    if (!dropdown) return;
    dropdown.classList.toggle("d_none");
}

/** Toggles the visibility of the contacts dropdown in the edit task overlay. */
function toggleEditDropdown() {
    const dropdown = document.getElementById("editContactsDropdown");
    if (!dropdown) return;
    dropdown.classList.toggle("d_none");
}

/** Closes the edit task overlay and resets the UI. */
function closeEditTaskOverlay() {
    const overlay = document.getElementById("editTaskOverlay");
    if (!overlay) return;

    overlay.classList.remove("open");
    overlay.classList.add("d_none");
    document.body.classList.remove("no-scroll");

    const dropdown = document.getElementById("editContactsDropdown");
    if (dropdown) {
        dropdown.classList.add("d_none");
    }
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

/** Adds a new subtask to the list of active subtasks. Clears the subtask input after adding the new task. */
function addEditSubtask() {
    const input = document.getElementById("editSubtaskInput");
    const value = input.value.trim();
    if (!value) return;

    editSubtasks.push(value);
    input.value = "";
    document.getElementById("editSubtaskConfirm").classList.add("d_none");

    renderEditSubtasks();
}

/** Clears the subtask input field and hides the confirm icon. */
function clearEditSubtaskInput() {
    document.getElementById("editSubtaskInput").value = "";
    document.getElementById("editSubtaskConfirm").classList.add("d_none");
}

/** Deletes an active subtask from the list of subtasks. */
function deleteEditSubtask(index) {
    editSubtasks.splice(index, 1);
    renderEditSubtasks();
}

/** Deletes a completed subtask from the list of completed subtasks. */
function deleteEditSubtaskDone(index) {
    editSubtasksDone.splice(index, 1);
    renderEditSubtasks();
}
