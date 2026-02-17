let currentDraggedElement;
let task = {};
let contactIndexMap = {};
let editGlobalContacts = [];
let editSelected = [];
let editSelectedPriority = null;
let editSubtasks = [];
let editSubtasksDone = [];
let draggedCard = null;
let placeholder = null;
let offsetY = 0;

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
  let arr = Array.isArray(contacts) ? contacts : Object.values(contacts);
  let valid = arr.filter((c) => c.name && typeof c.name === "string");
  valid.sort((a, b) =>
    a.name
      .split(" ")[0]
      .toLowerCase()
      .localeCompare(b.name.split(" ")[0].toLowerCase()),
  );
  contactIndexMap = {};
  valid.forEach((c, i) => (contactIndexMap[c.name] = i));
  return valid;
}

/** Updates all task columns in the UI based on current task data. */
function updateHTML(query = "") {
  const statuses = ["to_do", "in_progress", "await_feedback", "done"];

  statuses.forEach((status) => {
    const tasksInStatus = Object.entries(task)
      .filter(([_, t]) => t.status === status)
      .filter(([_, t]) => taskMatchesQuery(t, query));

    updateColumn(status, tasksInStatus);
  });

  addCardClickHandlers();
}

/** Checks if a task matches the current search query. */
function taskMatchesQuery(task, query) {
  if (!query) return true;
  query = query.toLowerCase();
  const matchArray = [
    task.title,
    task.description,
    ...(task.subtasks || []),
    ...(task.subtasksDone || []),
    ...(task.assigned || []),
  ];
  return matchArray.some(v => v.toLowerCase().includes(query));
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

  return emptyColumnTemplate(statusMessages[status]);
}

/** Starts dragging a task. */
function startDragging(id) {
  currentDraggedElement = id;
}

/** Allows drop by preventing default event. */
function allowDrop(ev) {
  ev.preventDefault();
}

/** Moves a task to a new status and updates Firebase + UI */
async function moveTo(status, key) {
  task[key].status = status;

  try { await updateFirebase(key, status); } 
  catch (e) { console.error("Firebase error:", e); }

  updateHTML();
  animateCardWiggle(key);
}

/** Animates the card with a wiggle effect */
function animateCardWiggle(key) {
  const card = document.getElementById(`card-${key}`);
  if (!card) return;

  card.classList.add("wiggle");
  card.addEventListener(
    "animationend",
    () => card.classList.remove("wiggle"),
    { once: true }
  );
}

/** Handles drop event to move task to new status. */
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

/** Generates assigned user HTML with colored circles */
function generateAssignedUsers(assigned) {
  if (!Array.isArray(assigned) || !assigned.length) return "";

  const maxVisible = 4;
  let html = "";

  const visibleUsers = assigned.slice(0, maxVisible);
  visibleUsers.forEach(name => {
    html += userCircleHTML(name, getColorForName(name));
  });

  const remaining = assigned.length - maxVisible;
  if (remaining > 0) html += userCircleHTML(`+${remaining}`, "black");

  return html;
}

/** Returns HTML for a single user circle with given color */
function userCircleHTML(name, color) {
  const initials = name.startsWith("+") ? name : getInitials(name);
  return `<div class="profile-icon" style="background-color: ${color}">${initials}</div>`;
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

/** Öffnet den Add-Task-Slider und initialisiert ihn. */
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
  setupClickHandler();
  await loadCategoriesIntoDropdown();
  renderSelectedContactCircles(contacts);
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

/** Template for creating a new task object */
function createTaskTemplate(info, id) {
  return { ...info, id: id, status: "to_do" };
}

/** Saves a new task from the overlay */
async function saveNewTaskOverlay(event) {
  event.preventDefault();
  if (!required(event)) return;

  const info = getTaskInformation();
  const newTask = createTaskTemplate(info, await getNextTaskId());

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
/** Template: drag/drop visual feedback for columns */
function setupDropzoneHighlight() {
  const columnIds = ["to_do","in_progress","await_feedback","done"];
  const overCounters = new WeakMap();

  const enter = col => { overCounters.set(col,(overCounters.get(col)||0)+1); col.classList.add("drop-target"); };
  const leave = col => { let n=(overCounters.get(col)||1)-1; overCounters.set(col,n<=0?0:n); if(n<=0) col.classList.remove("drop-target"); };
  const drop = col => { col.classList.remove("drop-target"); overCounters.set(col,0); };

  columnIds.forEach(id => {
    const col = document.getElementById(id); if(!col) return;
    overCounters.set(col,0);
    col.addEventListener("dragenter",()=>enter(col));
    col.addEventListener("dragleave",()=>leave(col));
    col.addEventListener("drop",()=>drop(col));
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

//** Generates an HTML element for a user's initials inside a circle. */
function generateAssignedUserCircle(name) {
  const initials = name
    .split(" ")
    .map((n) => n[0]?.toUpperCase())
    .join("")
    .slice(0, 2);
  return `<div class="user-circle">${initials}</div>`;
}

//** Checks if the given name matches the current logged-in user. */
function isYou(name) {
  return (
    !!currentUser &&
    typeof name === "string" &&
    name.trim().toLowerCase() === currentUser.trim().toLowerCase()
  );
}

/** Toggles a subtask's done status and updates Firebase + UI. */
async function toggleSubtask(taskKey, subtaskTitle, isChecked) {
  if (!task[taskKey]) return console.warn(`Task not found: ${taskKey}`);
  const t = task[taskKey];
  t.subtasks ??= [];
  t.subtasksDone ??= [];
  if (isChecked) {
    t.subtasksDone.includes(subtaskTitle) || t.subtasksDone.push(subtaskTitle);
    t.subtasks = t.subtasks.filter((s) => s !== subtaskTitle);
  } else {
    t.subtasks.includes(subtaskTitle) || t.subtasks.push(subtaskTitle);
    t.subtasksDone = t.subtasksDone.filter((s) => s !== subtaskTitle);
  }
  await patchTaskSubtasks(taskKey, t.subtasks, t.subtasksDone);
  updateHTML();
}

/** Template for PATCH request of subtasks */
async function patchTaskSubtasks(taskKey, subtasks, subtasksDone) {
  await fetch(`${BASE_URL}/tasks/${taskKey}.json`, {
    method: "PATCH",
    body: JSON.stringify({ subtasks, subtasksDone }),
  });
}

/** Deletes a task from Firebase and updates the board */
async function DeleteTask(taskKey) {
  if (!taskKey) return console.error("No task key provided");
  try {
    const res = await fetch(`${BASE_URL}/tasks/${taskKey}.json`, { method: "DELETE" });
    if (!res.ok) throw new Error(`Failed to delete task ${taskKey}`);
    delete task[taskKey];
    updateHTML();
    closeOverlay();
  } catch (e) {
    console.error("Error deleting task:", e);
  }
}

/** Opens the edit task overlay and fills in the task's details. */
async function editTask(key) {
  closeOverlay();
  clearEditSubtaskInput();

  const t = task[key];
  if (!t) return;

  document.getElementById("editTaskKey").value = key;
  document.getElementById("editTitle").value = t.title || "";
  document.getElementById("editDescription").value = t.description || "";
  document.getElementById("editDueDate").value = t.duedate || "";
  setPriorityEdit(t.priority || "low");

  await loadEditContacts(t.assigned || []);

  editSubtasks = [...(t.subtasks || [])];
  editSubtasksDone = [...(t.subtasksDone || [])];

  renderEditSubtasks();

  const overlay = document.getElementById("editTaskOverlay");
  overlay.classList.remove("d_none");
  overlay.classList.add("open");
  document.body.classList.add("no-scroll");
}

/** Activates a priority button and updates edit overlay */
function activateEdit(priority) {
  ["urgent","medium","low"].forEach(p=>{
    const btn=document.getElementById(p+"EditBtn");
    if(btn){btn.classList.remove("urgent","medium","low");
      ["Active","NotActive"].forEach(a=>{
        const i=document.getElementById(p+a+"Edit");
        if(i) i.classList.toggle("d_none",a==="Active")
      })
    }
  });
  const btn=document.getElementById(priority+"EditBtn");
  if(btn) btn.classList.add(priority);
  ["Active","NotActive"].forEach(a=>{
    const i=document.getElementById(priority+a+"Edit");
    if(i) i.classList.toggle("d_none",a!=="Active")
  });
  const o=document.getElementById("editTaskOverlay");
  if(o) o.dataset.priority=priority;
}

/** Sets task priority in edit overlay and updates buttons */
function setPriorityEdit(priority="low") {
  priority = priority.toLowerCase();
  ["urgent","medium","low"].forEach(p=>{
    const b=document.getElementById(p+"EditBtn"),
          a=document.getElementById(p+"ActiveEdit"),
          n=document.getElementById(p+"NotActiveEdit");
    if(b) b.classList.remove("urgent","medium","low");
    if(a) a.classList.add("d_none");
    if(n) n.classList.remove("d_none");
  });
  const b=document.getElementById(priority+"EditBtn"),
        a=document.getElementById(priority+"ActiveEdit"),
        n=document.getElementById(priority+"NotActiveEdit");
  if(b) b.classList.add(priority);
  if(a) a.classList.remove("d_none");
  if(n) n.classList.add("d_none");
  const o=document.getElementById("editTaskOverlay");
  if(o) o.dataset.priority=priority;
}

/** Saves edited task to backend and updates UI */
async function saveEditedTask() {
  const key = document.getElementById("editTaskKey").value;
  if(!key) return;

  const o=document.getElementById("editTaskOverlay"),
        priority=o?.dataset.priority||"low",
        updatedTask={
          title: document.getElementById("editTitle").value.trim(),
          description: document.getElementById("editDescription").value.trim(),
          duedate: document.getElementById("editDueDate").value.trim(),
          priority, assigned: getSelectedAssignedUsers(),
          subtasks: editSubtasks, subtasksDone: editSubtasksDone
        };
  try {
    const res=await fetch(`${BASE_URL}/tasks/${key}.json`,{method:"PATCH",body:JSON.stringify(updatedTask)});
    if(!res.ok) throw new Error(`Error saving task. Status: ${res.status}`);
    Object.assign(task[key],updatedTask);
    closeOverlay(); updateHTML();
  } catch(e){console.error("Error saving edited task:",e);}
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
  const priorities = ["urgent", "medium", "low"];

  priorities.forEach((p) => {
    const btn = document.getElementById(p + "EditBtn");
    if (!btn) return;

    btn.classList.remove("urgent", "medium", "low");

    const activeIcon = document.getElementById(p + "ActiveEdit");
    const notActiveIcon = document.getElementById(p + "NotActiveEdit");
    if (activeIcon) activeIcon.classList.add("d_none");
    if (notActiveIcon) notActiveIcon.classList.remove("d_none");
  });
}

/** Renders assigned users as profile icons in the edit overlay. */
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

/** Opens the edit task overlay and fills in all task details. */
function openEditTaskOverlay(task) {
  if (!task) return;

  document.getElementById("editTaskKey").value = task.id;
  document.getElementById("editTitle").value = task.title || "";
  document.getElementById("editDescription").value = task.description || "";
  document.getElementById("editDueDate").value = task.duedate || "";

  setPriorityEdit(task.priority || "low");

  loadEditContacts(task.assigned || []);
  renderSubtasksEdit(task.id);

  const overlay = document.getElementById("editTaskOverlay");
  overlay.classList.remove("d_none");
  overlay.classList.add("open");
  document.body.classList.add("no-scroll");
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

/** Loads contacts for edit overlay and marks selected ones */
async function loadEditContacts(selectedAssigned) {
  const data = await fetchContacts();
  const arr = Array.isArray(data)?data:Object.values(data||{});
  const valid = arr.filter(c=>c?.name&&typeof c.name==="string")
                   .sort((a,b)=>a.name.split(" ")[0].toLowerCase()
                   .localeCompare(b.name.split(" ")[0].toLowerCase()));
  editGlobalContacts = valid;
  editSelected = valid.map(c=>selectedAssigned.some(
    n=>n.trim().toLowerCase()===c.name.trim().toLowerCase())?1:0);
  renderEditContactDropdown();
  renderEditContactCircles();
}

/** Creates labels for contacts in the edit overlay dropdown */
function createEditContactLabels(contacts) {
  const dropdown = document.getElementById("editTaskContactDropDown");
  if (!dropdown) return;
  dropdown.innerHTML = contacts
    .map((c, i) => editContactLabelTemplate(c, circleColors[i % circleColors.length], editSelected[i]===1))
    .join("");
}

/** Renders the contact dropdown in the edit overlay */
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

/** Toggles the selection of a contact in the edit overlay. */
function toggleEditSelection(index) {
  editSelected[index] = editSelected[index] === 1 ? 0 : 1;

  const label = document.getElementById(`editContactLabel-${index}`);
  if (label)
    label.classList.toggle("contactSelected", editSelected[index] === 1);

  const checkboxImg = label.querySelector(".contact-checkbox");
  if (checkboxImg) {
    checkboxImg.src =
      editSelected[index] === 1
        ? "../assets/icons/checkbox-checked.svg"
        : "../assets/icons/checkbox-empty.svg";
  }

  renderEditContactCircles();
}

/** Renders selected contact circles in the edit overlay */
function renderEditContactCircles() {
  const c = document.getElementById("editTaskContactsSelected");
  if (!c) return;

  const selected = editGlobalContacts.filter((_, i) => editSelected[i] === 1);
  const visible = selected.slice(0, 4);
  c.innerHTML = visible.map(editContactCircleHTML).join("");
  if (selected.length > 4) c.innerHTML += `<span class="circle circleEdit more" style="background-color:black">+${selected.length-4}</span>`;
}

/** Renders subtasks in the edit overlay */
function renderEditSubtasks() {
  const list = document.getElementById("editSubtaskList");
  if (!list) return;

  if (editSubtasks.length === 0 && editSubtasksDone.length === 0) return list.classList.add("d_none");
  list.classList.remove("d_none");

  list.innerHTML =
    editSubtasks.map(activeSubtaskTemplate).join("") +
    editSubtasksDone.map(doneSubtaskTemplate).join("");
}

/** Toggles the visibility of a dropdown menu by its ID. */
function toggleDropdownById(id) {
  const dropdown = document.getElementById(id);
  if (!dropdown) return;
  dropdown.classList.toggle("d_none");
}

/** Toggles the visibility of the contacts dropdown in the edit task overlay. */
function toggleEditDropdown() {
  const input = document.getElementById("editTaskContacts");
  const dropdown = document.getElementById("editContactsDropdown");

  if (!input || !dropdown) return;

  dropdown.classList.toggle("d_none");
  input.classList.toggle("dropdownOpen");
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

/** Deletes a completed subtask from the list of completed subtasks. */
function deleteEditSubtask(index, done = false) {
  if (done) {
    editSubtasksDone.splice(index, 1);
  } else {
    editSubtasks.splice(index, 1);
  }
  renderEditSubtasks();
}

/** Starts editing a subtask directly in the edit overlay */
function startEditEditSubtask(index, done = false) {
  const list = document.getElementById("editSubtaskList");
  const li = list.children[index + (done ? editSubtasks.length : 0)];
  const text = done ? editSubtasksDone[index] : editSubtasks[index];

  li.innerHTML = editSubtaskTemplate(text, index, done);
  li.querySelector("input").focus();
}

/** Confirm the edit of a subtask and update the corresponding array. */
function confirmEditSubtaskEntry(index, value, done = false) {
  const text = value.trim();
  if (!text) return renderEditSubtasks();

  if (done) {
    editSubtasksDone[index] = text;
  } else {
    editSubtasks[index] = text;
  }

  renderEditSubtasks();
}

/** Handle keyboard events while editing a subtask. Pressing Enter confirms the edit; Escape cancels it. */
function handleEditSubtaskKey(e, index, done = false) {
  if (e.key === "Enter") {
    confirmEditSubtaskEntry(index, e.target.value, done);
  }
  if (e.key === "Escape") {
    renderEditSubtasks();
  }
}

/** Handles window resize events for the "Add Task" overlay.*/
function handleResizeAddTaskOverlay() {
  const overlay = document.getElementById("addTaskBoard");
  if (!overlay) return;

  const isOpen = overlay.classList.contains("open");

  if (window.innerWidth < 1400 && isOpen) {
    closeOverlay();
    document.body.classList.remove("no-scroll");
    window.location.href = "addtask.html";
  }
}

/** Listen for window resize events to adapt the Add Task overlay behavior. */
window.addEventListener("resize", handleResizeAddTaskOverlay);




let touchStartY = 0;
let touchStartX = 0;
let hasMoved = false;

document.addEventListener("touchstart", (e) => {
  const card = e.target.closest(".card");
  if (!card) return;

  draggedCard = card;

  const rect = card.getBoundingClientRect();
  touchStartY = e.touches[0].clientY;
  touchStartX = e.touches[0].clientX;
  hasMoved = false;

  placeholder = document.createElement("div");
  placeholder.classList.add("card-placeholder");
  placeholder.style.width = `${card.offsetWidth}px`;
  placeholder.style.height = `${card.offsetHeight}px`;
  card.parentElement.insertBefore(placeholder, card);

  document.body.classList.add("no-scroll");
});

document.addEventListener(
  "touchmove",
  (e) => {
    if (!draggedCard) return;

    const touch = e.touches[0];
    const deltaY = Math.abs(touch.clientY - touchStartY);
    const deltaX = Math.abs(touch.clientX - touchStartX);

    if (!hasMoved && (deltaY > 10 || deltaX > 10)) {
      hasMoved = true;

      const rect = draggedCard.getBoundingClientRect();
      draggedCard.classList.add("dragging");
      draggedCard.style.position = "absolute";
      draggedCard.style.zIndex = 999;
      draggedCard.style.pointerEvents = "none";
      draggedCard.style.width = `${rect.width}px`;
      draggedCard.style.left = `${rect.left}px`;
      draggedCard.style.top = `${rect.top}px`;

      offsetY = touch.clientY - rect.top;
    }

    if (!hasMoved) return;

    if (e.cancelable) e.preventDefault();

    draggedCard.style.top = `${touch.clientY - offsetY}px`;
    draggedCard.style.left = `${placeholder.getBoundingClientRect().left}px`;

    const lists = Array.from(document.querySelectorAll(".card-list"));
    lists.forEach((list) => {
      const listRect = list.getBoundingClientRect();
      if (touch.clientY > listRect.top && touch.clientY < listRect.bottom) {
        list.classList.add("drop-target");

        const cards = Array.from(list.querySelectorAll(".card:not(.dragging)"));
        let inserted = false;
        for (const card of cards) {
          const cardRect = card.getBoundingClientRect();
          if (touch.clientY < cardRect.top + cardRect.height / 2) {
            list.insertBefore(placeholder, card);
            inserted = true;
            break;
          }
        }
        if (!inserted) list.appendChild(placeholder);
      } else {
        list.classList.remove("drop-target");
      }
    });
  },
  { passive: false },
);

document.addEventListener("touchend", async (e) => {
  if (!draggedCard) return;

  if (!hasMoved) {
    draggedCard = null;
    placeholder.remove();
    placeholder = null;
    document.body.classList.remove("no-scroll");
    return;
  }

  placeholder.parentElement.insertBefore(draggedCard, placeholder);

  const newStatus = placeholder.parentElement.id;
  const key = draggedCard.dataset.key;

  await moveTo(newStatus, key);

  draggedCard.classList.remove("dragging");
  draggedCard.style.position = "";
  draggedCard.style.zIndex = "";
  draggedCard.style.pointerEvents = "";
  draggedCard.style.left = "";
  draggedCard.style.top = "";
  draggedCard.style.width = "";

  document.querySelectorAll(".card-list.drop-target").forEach((list) => {
    list.classList.remove("drop-target");
  });

  placeholder.remove();
  placeholder = null;
  draggedCard = null;
  hasMoved = false;

  document.body.classList.remove("no-scroll");
});
