let selected = [];
let globalContacts = [];
let selectedPriority = null;

/** Init data */
function init() {
  showUserInitial();
  loadContactsIntoDropdown();
  loadCategoriesIntoDropdown();
  activate("medium");
  setMinDate();

  document
    .getElementById("addTaskDate")
    .addEventListener("change", validateDateInput);
}

/** Checks if required input is available */
function checkField(fieldId, errorId) {
  const field = document.getElementById(fieldId);
  const error = document.getElementById(errorId);
  const valid = field && field.value !== "";
  toggleError(field, error, !valid);
  return valid;
}

/** Shows or hides error based on flag */
function toggleError(field, errorElement, show) {
  if (field) field.classList.toggle("inputError", show);
  if (errorElement) {
    errorElement.classList.toggle("d_none", !show);
    errorElement.style.display = show ? "block" : "none";
  }
}

/** Checks if required fields are filled and shows errors. Always validates all fields regardless of previous errors. */
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

/** Activates task priority */
function activate(priority) {
  ["urgent", "medium", "low"].forEach((prio) => {
    const button = document.getElementById(prio);
    const activeImg = document.getElementById(prio + "Active");
    const notActiveImg = document.getElementById(prio + "NotActive");
    const isActive = prio === priority;
    [activeImg, notActiveImg].forEach((img) =>
      img.classList.toggle(
        "d_none",
        img !== (isActive ? activeImg : notActiveImg),
      ),
    );
    button.classList.toggle(prio, isActive);
  });
  selectedPriority = priority;
}

/** Dropdown arrow toggle */
function toggleDropdownInputArrow(dropdownId, isOpen) {
  document
    .getElementById(
      dropdownId === "contacts" ? "addTaskContacts" : "addTaskCategory",
    )
    .classList.toggle("open", isOpen);
}

/** Global click handler for dropdowns */
window.onclick = (event) => {
  [
    {
      inputId: "addTaskContacts",
      wrapperId: "contacts",
      labelFor: "addTaskContacts",
    },
    {
      inputId: "addTaskCategory",
      wrapperId: "category",
      labelFor: "addTaskCategory",
    },
  ].forEach((dd) => {
    if (!dd.inputId || !dd.wrapperId) return;
    handleDropdownClickOutside(dd, event);
    if (
      event.target.closest(`label[for="${dd.labelFor}"]`) &&
      dd.wrapperId === "contacts"
    )
      handleDropdownClickOnLabel(dd);
  });
};

/** Closes dropdown if clicked outside */
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

/** Click on label opens contact dropdown */
function handleDropdownClickOnLabel({ wrapperId }) {
  if (wrapperId === "contacts") renderSelectedContactCircles(globalContacts);
}

/** Load contacts into dropdown */
async function loadContactsIntoDropdown() {
  let contacts = Object.values(await fetchContacts())
    .filter((c) => c.name && typeof c.name === "string")
    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

  globalContacts = contacts;
  createLabels(contacts);
  setupClickHandler();
  renderSelectedContactCircles(globalContacts); // initial render
}

/** Creates labels for contacts */
function createLabels(contacts) {
  const dropdown = document.getElementById("addTaskContactDropDown");
  dropdown.innerHTML = "";
  selected = contacts.map((contact, i) => {
    const label = document.createElement("label");
    label.id = `contactLabel-${i}`;
    label.innerHTML = contactLabelTemplate(
      contact,
      circleColors[i % circleColors.length],
    );
    dropdown.appendChild(label);
    return 0;
  });
}

/** Click handling for contact dropdown */
function setupClickHandler() {
  document.getElementById("addTaskContactDropDown").onclick = (e) => {
    let target =
      e.target.tagName === "DIV" && e.target.parentElement.tagName === "LABEL"
        ? e.target.parentElement
        : e.target;
    if (target.tagName === "LABEL") toggleSelection(target);
  };
}

/** Toggle contact selection */
function toggleSelection(label) {
  const idx = parseInt(label.id.split("-").pop(), 10);
  if (isNaN(idx)) return;
  selected[idx] ^= 1; // toggle 0/1
  label.classList.toggle("contactSelected", selected[idx]);
  renderSelectedContactCircles(globalContacts);
}

/** Render contact circles (always visible) */
function renderSelectedContactCircles(contacts) {
  const container = document.getElementById("addTaskContaktsSelected");
  if (!container) return (container.innerHTML = "");
  container.innerHTML = "";

  const selectedContacts = Object.keys(contacts)
    .map((k, i) => ({ contact: contacts[k], i }))
    .filter(({ contact, i }) => contact?.name && selected[i]);

  selectedContacts.slice(0, 4).forEach(({ contact, i }) => {
    const c = document.createElement("span");
    c.className = "circle";
    c.textContent = getInitials(contact.name);
    c.style.backgroundColor = circleColors[i % circleColors.length];
    container.appendChild(c);
  });

  if (selectedContacts.length > 4) {
    const more = document.createElement("span");
    more.className = "circle moreCircle";
    more.textContent = `+${selectedContacts.length - 4}`;
    container.appendChild(more);
  }

  container.classList.remove("d_none");
}

/** Filter contacts in dropdown */
function filterContacts() {
  const input = document.getElementById("addTaskContacts").value.toLowerCase();
  const labels = document
    .getElementById("addTaskContactDropDown")
    .getElementsByTagName("label");
  Array.from(labels).forEach((label) => {
    const show = label.textContent.toLowerCase().includes(input);
    label.classList.toggle("d_none", !show);
  });

  const container = document.getElementById("addTaskContaktsSelected");
  container && container.classList.remove("d_none");
}

/** Loads and displays categories into the dropdown. Fetches tasks, extracts valid categories, and updates the dropdown UI. */
async function loadCategoriesIntoDropdown() {
  try {
    const tasks = await fetchTasks();
    const categories = getValidCategories(tasks);
    updateDropdown(categories);
  } catch (error) {
    console.error("Error loading categories:", error);
  }
}

/** Extracts valid categories from the tasks. Filters out invalid categories (undefined or empty strings). */
function getValidCategories(tasks) {
  return new Set(
    Object.values(tasks)
      .map((task) => task.category)
      .filter((category) => category && category !== "undefined")
  );
}

/** Updates the category dropdown with the given valid categories. Creates and appends category labels to the dropdown. */
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

/** Creates a label element for a category. The label will display the category name and set the input field value on click. */
function createCategoryLabel(category, inputField) {
  const label = document.createElement("label");
  label.innerHTML = `<div>${category}</div>`;
  label.onclick = () => {
    inputField.value = category;
    closeCategoryDropdown();
  };
  return label;
}

/** Toggle category dropdown */
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

/** Close category dropdown */
function closeCategoryDropdown() {
  toggleDropdownById("category");
}

/** Toggles the visibility of the confirm icon based on input value */
function changeSubtaskIcon() {
  const input = document.getElementById("addTaskSubtasks");
  const icon = document.getElementById("addTaskSubtaskConfirm");
  icon.classList.toggle("d_none", input.value.trim() === "");
}

/** Confirms the current subtask input and adds it to the subtask list */
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

/** Deletes a specific subtask element from the list */
function deleteSubtask(el) {
  el.closest("li").remove();
}

/** Allows editing a subtask by replacing it with an input field */
function editSubtask(el) {
  const li = el.tagName === "LI" ? el : el.parentNode.parentNode;
  li.outerHTML = editSubtaskHTML(
    li.firstElementChild.textContent.replace(/^•\s*/, "").trim(),
  );
}

/** Removes a subtask edit wrapper from the DOM */
function trashSubtask(iconEl) {
  iconEl.closest(".subtaskEditWrapper")?.remove();
}

/** Saves an edited subtask and replaces the input field with text */
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
  document
    .querySelectorAll(".errorTextAddTask")
    .forEach((e) => e.classList.add("d_none"));
  document
    .querySelectorAll(".inputError")
    .forEach((e) => e.classList.remove("inputError"));
}

/** Clears all selected contacts and resets the contact dropdown */
function clearContacts() {
  selected = [];
  const container = document.getElementById("addTaskContaktsSelected");
  if (container) container.innerHTML = "";
  Array.from(
    document
      .getElementById("addTaskContactDropDown")
      .getElementsByTagName("label"),
  ).forEach((l) => l.classList.remove("contactSelected"));
}

/** Clears all subtasks and hides the subtask list */
function clearSubtasks() {
  const list = document.getElementById("addTaskSubtaskList");
  if (list) {
    list.innerHTML = "";
  }
}

/**Retrieves all information from the task form */
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

/** Retrieves the names of all selected contacts */
function getTaskContactsInformation() {
  return Object.keys(globalContacts)
    .filter((_, i) => selected[i])
    .map((i) => globalContacts[i].name);
}

/** Retrieves all subtasks from the subtask list */
function getTaskSubtaskInformation() {
  const list = document.getElementById("addTaskSubtaskList");
  return Array.from(list.children).map((li) =>
    li.textContent.replace(/^[•\.\-\*\s]+/, "").trim(),
  );
}

/** Save task */
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

/** Validates the selected date in the task form. If the chosen date is before today, it automatically resets the date to today's date. Additionally, it prevents showing the 'required' error if the user has typed the date manually. */
function validateDateInput() {
  const input = document.getElementById("addTaskDate");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const selectedDate = new Date(input.value);
  const isManualInput = input.value && !input.value.includes('-');

  if (selectedDate < today && !isManualInput) {
    const yyyy = today.getFullYear(),
      mm = String(today.getMonth() + 1).padStart(2, "0"),
      dd = String(today.getDate()).padStart(2, "0");
    input.value = `${yyyy}-${mm}-${dd}`;
  }

  if (isManualInput) {
    document.getElementById("addTaskDateError").classList.add("d_none");
  }
}

/** Retrieves the next available task ID from the backend. */
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

/** Sends a new task to the backend API and updates the last task ID. */
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


