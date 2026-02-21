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
  let arr = Array.isArray(contacts) ? contacts : Object.values(contacts);
  let valid = arr.filter((c) => c.name && typeof c.name === "string");
  valid.sort((a, b) =>
    a.name.split(" ")[0].toLowerCase().localeCompare(b.name.split(" ")[0].toLowerCase()),
  );
  contactIndexMap = {};
  valid.forEach((c, i) => (contactIndexMap[c.name] = i));
  return valid;
}

/** Updates the task status in Firebase. */
async function updateFirebase(taskId, newStatus) {
  let url = `${BASE_URL}/tasks/${taskId}.json`;
  let payload = { status: newStatus };

  try {
    await fetch(url, {method: "PATCH", body: JSON.stringify(payload), });
  } catch (error) {
    console.error("Error updating Firebase:", error);
    throw error;
  }
}

/** Returns HTML for a single user circle with given color */
function userCircleHTML(name, color) {
  const initials = name.startsWith("+") ? name : getInitials(name);
  return `<div class="profile-icon" style="background-color: ${color}">${initials}</div>`;
}

/** Returns the file path for a priority icon image. */
function dynamicPriorityIcon(priority) {
  let formatted = priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
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
  clearBoardOverlay();
  showUserInitial();
  let contacts = await loadContactsIntoDropdown();
  setupClickHandler();
  await loadCategoriesIntoDropdown();
  renderSelectedContactCircles(contacts);
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

  clearBoardOverlay();
  closeOverlay();
  updateHTML();
}

/** Opens the info overlay by adding the 'open' class.*/
function openInfoOverlay() {
  let overlay = document.getElementById("infoOverlay");
  if (overlay) {
    overlay.classList.add("open");
  }
}

/** Checks if the given name matches the current logged-in user. */
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

/** Opens the edit task overlay and populates fields with the task's data.
 * @param {string} key - The unique key of the task to edit. */
async function editTask(key) {
  closeOverlay();
  clearEditSubtaskInput();

  const t = task[key];
  if (!t) return;

  const set = (id, val) => document.getElementById(id).value = val || "";

  set("editTaskKey", key);
  set("editTitle", t.title);
  set("editDescription", t.description);
  set("editDueDate", t.duedate);
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
  const valid = arr.filter(c=>c?.name&&typeof c.name==="string").sort((a,b)=>a.name.split(" ")[0].toLowerCase().localeCompare(b.name.split(" ")[0].toLowerCase()));
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
  dropdown.innerHTML = contacts.map((c, i) => editContactLabelTemplate(c, circleColors[i % circleColors.length], editSelected[i]===1)).join("");
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

function clearBoardOverlay() {
  const container = document.getElementById("boardAddTask");
  if (!container) return;

  container.querySelectorAll("input, textarea").forEach((el) => {
    el.value = "";
  });

  container.querySelectorAll(".errorTextAddTask").forEach((e) => e.classList.add("d_none"));
  container.querySelectorAll(".inputError").forEach((e) => e.classList.remove("inputError"));

  ["urgent", "medium", "low"].forEach((prio) => {
    const btn = container.querySelector(`#${prio}`);
    if (btn) btn.classList.remove(prio);
    const active = container.querySelector(`#${prio}Active`);
    const notActive = container.querySelector(`#${prio}NotActive`);
    if (active) active.classList.add("d_none");
    if (notActive) notActive.classList.remove("d_none");
  });

  activate("medium");

  const selectedContainer = container.querySelector("#addTaskContaktsSelected");
  if (selectedContainer) selectedContainer.innerHTML = "";
  
  const subtaskList = container.querySelector("#addTaskSubtaskList");
  if (subtaskList) subtaskList.innerHTML = "";

  selected = [];
  selectedPriority = null;
}