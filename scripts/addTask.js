let selected = [];
let globalContacts = [];
let selectedPriority = null;

/** Initializes the Add Task page. Loads contacts and categories, sets default priority and date limits.
 * @returns {void} */
function init() {
  showUserInitial();
  loadContactsIntoDropdown();
  loadCategoriesIntoDropdown();
  activate("medium");
  setMinDate();

  document.getElementById("addTaskDate").addEventListener("change", validateDateInput);
}

/** Validates a required input field and toggles its error display.
 * @param {string} fieldId - ID of the input element.
 * @param {string} errorId - ID of the associated error element.
 * @returns {boolean} True if the field has a value, false otherwise. */
function checkField(fieldId, errorId){
  const f=document.getElementById(fieldId),e=document.getElementById(errorId),v=f&&f.value!="";
  f&&f.classList.toggle("inputError",!v);
  e&&(e.classList.toggle("d_none",v),e.style.display=v?"none":"block");
  return v;
}

/** Validates all required fields on form submission.
 * @param {Event} event - The submit event.
 * @returns {boolean} True if all required fields are valid. */
function required(event) {
  const fields = ["Title", "Date", "Category"];
  let isValid = true;

  fields.forEach((id) => {
    const valid = checkField(`addTask${id}`, `addTask${id}Error`);
    if (!valid) isValid = false;
  });

  if (!isValid) event.preventDefault();
  return isValid;
}

/** Activates the selected task priority.
 * @param {"urgent"|"medium"|"low"} priority - The selected priority level. */
function activate(priority) {
  ["urgent", "medium", "low"].forEach(prio => {
    const isActive = prio === priority;
    document.getElementById(prio).classList.toggle(prio, isActive);
    document.getElementById(prio + "Active").classList.toggle("d_none", !isActive);
    document.getElementById(prio + "NotActive").classList.toggle("d_none", isActive);
  });
  selectedPriority = priority;
}

/** Toggles the dropdown arrow state.
 * @param {string} dropdownId - The dropdown identifier.
 * @param {boolean} isOpen - Indicates whether the dropdown is open. */
function toggleDropdownInputArrow(dropdownId, isOpen) {
  document.getElementById(dropdownId === "contacts" ? "addTaskContacts" : "addTaskCategory",).classList.toggle("open", isOpen);
}

/** Closes the dropdown if a click occurs outside of it.
 * @param {{inputId:string, wrapperId:string}} params - Dropdown identifiers.
 * @param {Event} event - The click event. */
function handleDropdownClickOutside({ inputId, wrapperId }, event) {
  const input = document.getElementById(inputId);
  const wrapper = document.getElementById(wrapperId);
  if (!input || !wrapper) return;

  if (!(input.contains(event.target) || wrapper.contains(event.target))) {
    wrapper.classList.add("d_none");
    input.classList.remove("open");
    if (wrapperId === "contacts") renderSelectedContactCircles(globalContacts);
  }
}

/** Handles label click to open the contact dropdown.
 * @param {{wrapperId:string}} params - Wrapper identifier. */
function handleDropdownClickOnLabel({ wrapperId }) {
  if (wrapperId === "contacts") renderSelectedContactCircles(globalContacts);
}

/** Loads contacts from the backend into the dropdown. */
async function loadContactsIntoDropdown() {
  let contacts = Object.values(await fetchContacts()).filter((c) => c.name && typeof c.name === "string").sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

  globalContacts = contacts;
  createLabels(contacts);
  setupClickHandler();
  renderSelectedContactCircles(globalContacts);
}

/** Creates label elements for all contacts.
 * @param {Array<Object>} contacts - List of contact objects. */
function createLabels(contacts) {
  const dropdown = document.getElementById("addTaskContactDropDown");
  dropdown.innerHTML = "";
  selected = contacts.map((contact, i) => {
    const label = document.createElement("label");
    label.id = `contactLabel-${i}`;
    label.innerHTML = contactLabelTemplate(contact, circleColors[i % circleColors.length]);
    dropdown.appendChild(label);
    return 0;
  });
}

/** Sets up click handling for the contact dropdown. */
function setupClickHandler() {
  document.getElementById("addTaskContactDropDown").onclick = (e) => {
    let target =
      e.target.tagName === "DIV" && e.target.parentElement.tagName === "LABEL"
        ? e.target.parentElement
        : e.target;
    if (target.tagName === "LABEL") toggleSelection(target);
  };
}

/** Toggles the selection state of a contact.
 * @param {HTMLLabelElement} label - The clicked label element. */
function toggleSelection(label) {
  const idx = parseInt(label.id.split("-").pop(), 10);
  if (isNaN(idx)) return;
  selected[idx] ^= 1;
  label.classList.toggle("contactSelected", selected[idx]);
  renderSelectedContactCircles(globalContacts);
}

/** Renders selected contacts as avatar circles in the dropdown. Shows up to 4 circles; adds a "+X" circle if more are selected.
 * @param {Array<Object>} c - List of all contacts. */
function renderSelectedContactCircles(c){
  const n=document.getElementById("addTaskContaktsSelected");if(!n)return;n.innerHTML="";
  Object.keys(c).map((k,i)=>({c:c[k],i})).filter(({c,i})=>c?.name&&selected[i]).slice(0,4).forEach(({c,i})=>{const s=document.createElement("span");s.className="circle";s.textContent=getInitials(c.name);s.style.backgroundColor=circleColors[i%circleColors.length];n.appendChild(s)});
  const sel=Object.keys(c).filter((_,i)=>c[_]?.name&&selected[i]);if(sel.length>4){const m=document.createElement("span");m.className="circle moreCircle";m.textContent=`+${sel.length-4}`;n.appendChild(m)}
  n.classList.remove("d_none");
}

/** Filter contacts in dropdown */
function filterContacts() {
  const input = document.getElementById("addTaskContacts").value.toLowerCase();
  const labels = document.getElementById("addTaskContactDropDown").getElementsByTagName("label");
  Array.from(labels).forEach((label) => {const show = label.textContent.toLowerCase().includes(input);
    label.classList.toggle("d_none", !show);
  });

  const container = document.getElementById("addTaskContaktsSelected");
  container && container.classList.remove("d_none");
}

/** Loads categories from existing tasks into the dropdown.
 * @async
 * @returns {Promise<void>} */
async function loadCategoriesIntoDropdown() {
  try {
    const tasks = await fetchTasks();
    const categories = getValidCategories(tasks);
    updateDropdown(categories);
  } catch (error) {
    console.error("Error loading categories:", error);
  }
}

/** Extracts valid categories from task data.
 * @param {Object} tasks - Task objects retrieved from backend.
 * @returns {Set<string>} A set of unique valid categories. */
function getValidCategories(tasks) {
  return new Set(Object.values(tasks).map((task) => task.category).filter((category) => category && category !== "undefined"));
}

/** Updates the category dropdown with available categories.
 * @param {Set<string>} categories - Set of category names. */
function updateDropdown(categories) {
  const dropdown = document.getElementById("addTaskCategoryDropDown");
  const inputField = document.getElementById("addTaskCategory");
  dropdown.innerHTML = "";

  categories.forEach((category) => {
    if (category.trim()) {
      const label = createCategoryLabel(category, inputField);
      dropdown.appendChild(label);
    } else {
      console.warn("Invalid category found:", category);
    }
  });
}

/** Creates a label element for a category.
 * @param {string} category - The category name.
 * @param {HTMLInputElement} inputField - The related input field.
 * @returns {HTMLLabelElement} */
function createCategoryLabel(category, inputField) {
  const label = document.createElement("label");
  label.innerHTML = `<div>${category}</div>`;
  label.onclick = () => {
    inputField.value = category;
    closeCategoryDropdown();
  };
  return label;
}

/** Toggles the visibility of a dropdown by its ID.
 * @param {string} dropdownId - The dropdown wrapper ID. */
function toggleDropdownById(dropdownId) {
  const wrapper = document.getElementById(dropdownId);
  const dropdown = document.getElementById("addTaskCategoryDropDown");
  const input = document.getElementById("addTaskCategory");
  const isHidden = wrapper.classList.contains("d_none");
  wrapper.classList.toggle("d_none", !isHidden);
  dropdown.classList.toggle("d_none", !isHidden);
  input.classList.toggle("open", isHidden);
  toggleDropdownInputArrow(dropdownId, isHidden);
}

/** Closes the category dropdown. */
function closeCategoryDropdown() {
  toggleDropdownById("category");
}

/** Toggles the visibility of the subtask confirm icon. */
function changeSubtaskIcon() {
  const input = document.getElementById("addTaskSubtasks");
  const icon = document.getElementById("addTaskSubtaskConfirm");
  icon.classList.toggle("d_none", input.value.trim() === "");
}

/** Confirms and adds a new subtask to the list. */
function confirmSubtaskEntry() {
  const input = document.getElementById("addTaskSubtasks");
  const value = input.value.trim();
  if (!value) return;
  const list = document.getElementById("addTaskSubtaskList");
  list.classList.remove("d_none");
  list.innerHTML += confirmSubtaskEntryHTML(value);
  input.value = "";
  document.getElementById("addTaskSubtaskConfirm").classList.add("d_none");
}

/** Clears the subtask input field */
function deleteSubtaskEntry() {
  document.getElementById("addTaskSubtasks").value = "";
}

/** Deletes a specific subtask element.
 * @param {HTMLElement} el - Element inside the subtask list item. */
function deleteSubtask(el) {
  el.closest("li").remove();
}

/** Enables edit mode for a subtask.
 * @param {HTMLElement} el - The subtask element. */
function editSubtask(el) {
  const li = el.tagName === "LI" ? el : el.parentNode.parentNode;
  li.outerHTML = editSubtaskHTML(li.firstElementChild.textContent.replace(/^•\s*/, "").trim());
}

/** Removes a subtask currently in edit mode.
 * @param {HTMLElement} iconEl - The delete icon element. */
function trashSubtask(iconEl) {
  iconEl.closest(".subtaskEditWrapper")?.remove();
}

/** Saves an edited subtask.
 * @param {HTMLElement} iconEl - The save icon element. */
function saveSubtask(iconEl) {
  const wrapper = iconEl.parentNode.parentNode;
  const value = wrapper.firstElementChild.value.trim();
  if (!value) return;
  wrapper.outerHTML = createSubtaskHTML(value);
}

/** Clears the entire form including fields, errors, contacts, subtasks, and resets the priority to "medium" */
function clearAll() {
  clearFormFields();
  clearErrors();
  clearContacts();
  clearSubtasks();
  activate("medium");
}

/** Clears all form input fields */
function clearFormFields() {
  ["Title", "Description", "Date", "Category", "Contacts"].forEach(
    (id) => (document.getElementById(`addTask${id}`).value = ""),
  );
}

/** Hides all error messages and removes input error styling */
function clearErrors() {
  document.querySelectorAll(".errorTextAddTask").forEach((e) => e.classList.add("d_none"));
  document.querySelectorAll(".inputError").forEach((e) => e.classList.remove("inputError"));
}

/** Clears all selected contacts and resets the contact dropdown */
function clearContacts() {
  selected = [];
  const container = document.getElementById("addTaskContaktsSelected");
  if (container) container.innerHTML = "";
  Array.from(
    document.getElementById("addTaskContactDropDown").getElementsByTagName("label")).forEach((l) => l.classList.remove("contactSelected"));
}

/** Clears all subtasks and hides the subtask list */
function clearSubtasks() {
  const list = document.getElementById("addTaskSubtaskList");
  if (list) {
    list.innerHTML = "";
  }
}

/** Collects all task information from the form.
 * @returns {{
 *   title: string,
 *   description: string,
 *   duedate: string,
 *   category: string,
 *   priority: string,
 *   assigned: string[],
 *   subtasks: string[]
 * }} 
 * */
function getTaskInformation() {
  return {
    title: document.getElementById("addTaskTitle").value,
    description: document.getElementById("addTaskDescription").value,
    duedate: document.getElementById("addTaskDate").value,
    category: document.getElementById("addTaskCategory").value,
    priority: selectedPriority
      ? selectedPriority[0].toUpperCase() + selectedPriority.slice(1)
      : "",
    assigned: getTaskContactsInformation(),
    subtasks: getTaskSubtaskInformation(),
  };
}

/** Returns the names of all selected contacts.
 * @returns {string[]} Array of contact names. */
function getTaskContactsInformation() {
  return Object.keys(globalContacts).filter((_, i) => selected[i]).map((i) => globalContacts[i].name);
}

/** Returns all subtasks as an array of strings.
 * @returns {string[]} Array of subtask texts. */
function getTaskSubtaskInformation() {
  const list = document.getElementById("addTaskSubtaskList");
  return Array.from(list.children).map((li) => li.textContent.replace(/^[•\.\-\*\s]+/, "").trim());
}

/** Saves a new task to the backend.
 * @param {Event} event - The submit event.
 * @async
 * @returns {Promise<void>} */
async function saveNewTask(event) {
  event.preventDefault();
  if (!required(event)) return;
  const newTask = {
    ...getTaskInformation(),
    id: await getNextTaskId(),
    status: "to_do",
  };
  await loadTaskIntoAPI(newTask);
  clearAll();
  document.getElementById("addTaskSuccessful").classList.remove("d_none");
  setTimeout(() => (window.location.href = "board.html"), 1000);
}

/** Retrieves the next available task ID from backend.
 * @async
 * @returns {Promise<number>} The next task ID. */
async function getNextTaskId() {
  try {
    const res = await fetch(`${BASE_URL}/tasks/lastTaskId.json`);
    const lastId = parseInt(await res.json()) || 0;
    return lastId + 1;
  } catch (e) {
    console.error("Failed to get next task ID:", e);
    return 1;
  }
}

/** Sends a new task object to the backend API.
 * @param {Object} newTask - The task object to store.
 * @async
 * @returns {Promise<void>} */
async function loadTaskIntoAPI(newTask) {
  try {
    const lastIdRes = await fetch(`${BASE_URL}/tasks/lastTaskId.json`);
    const nextId = (parseInt(await lastIdRes.json()) || 0) + 1;

    await fetch(`${BASE_URL}/tasks/task${nextId}.json`, {
      method: "PUT",
      body: JSON.stringify(newTask),
    });

    await fetch(`${BASE_URL}/tasks/lastTaskId.json`, {
      method: "PUT",
      body: JSON.stringify(nextId),
    });
  } catch (e) {
    console.error("Failed to load task into API:", e);
  }
}
