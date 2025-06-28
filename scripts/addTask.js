let selected = [];
let globalContacts = [];
let selectedPriority = null;

/** Init data*/
function init() {
  showUserInitial();
  loadContactsIntoDropdown();
  loadCategoriesIntoDropdown();
}

/** Check if the required input is available */
function checkField(fieldId, errorId) {
  let field = document.getElementById(fieldId);
  let error = document.getElementById(errorId);

  if (!field || field.value === "") {
    showError(field, error);
    return false;
  }

  hideError(field, error);
  return true;
}

/** If the required information is missing, display an error message */
function showError(field, errorElement) {
  if (field) field.classList.add("inputError");
  if (errorElement) {
    errorElement.classList.remove("d_none");
    errorElement.style.display = "block";
  }
}

/** If the required information is available, remove the error message */
function hideError(field, errorElement) {
  if (field) field.classList.remove("inputError");
  if (errorElement) {
    errorElement.style.display = "none";
    errorElement.classList.add("d_none");
  }
}

/** Calls for the necessary information and prevents the submission of the form, if the required information is missing*/
function required(event) {
  let isTitleValid = checkField("addTaskTitle", "addTaskTextError");
  let isDateValid = checkField("addTaskDate", "addTaskDateError");
  let isCategoryValid = checkField("addTaskCategory", "addTaskCategoryError");

  let isValid = isTitleValid && isDateValid && isCategoryValid;

  if (!isValid) {
    event.preventDefault();
  }

  return isValid;
}

/** Activates the priority of the task by adding CSS */
function activate(priority) {
  let priorities = ["urgent", "medium", "low"];

  priorities.forEach(prio => {
    let button = document.getElementById(prio);
    let notActiveImg = document.getElementById(prio + "NotActive");
    let activeImg = document.getElementById(prio + "Active");
    let isActive = prio === priority;

    notActiveImg.classList.toggle("d_none", isActive);
    activeImg.classList.toggle("d_none", !isActive);
    button.classList.toggle(prio, isActive);
  });

  selectedPriority = priority;
}

/** Toggles the visibility of the dropdown menu for category and contacts */
function toggleDropdownById(dropdownId) {
  let dropdown = document.getElementById(dropdownId);
  dropdown.classList.toggle("d_none");

  let isOpen = !dropdown.classList.contains("d_none");

  toggleDropdownInputArrow(dropdownId, isOpen);

  if (dropdownId === "contacts") {
    handleContactDropdownVisibility(isOpen);
  }
}

/** Rotates the arrow in the dropdown, when the menu is open */
function toggleDropdownInputArrow(dropdownId, isOpen) {
  let inputId = dropdownId === "contacts" ? "addTaskContacts" : "addTaskCategory";
  let input = document.getElementById(inputId);
  input.classList.toggle("open", isOpen);
}

/** Closes all dropdowns when clicking somewhere else outside the menu */
window.onclick = function (event) {
  let dropdowns = [
    {inputId: "addTaskContacts", wrapperId: "contacts", labelFor: "addTaskContacts",},
    {inputId: "addTaskCategory", wrapperId: "category", labelFor: "addTaskCategory",
    },
  ];

  dropdowns.forEach(({ inputId, wrapperId, labelFor }) => {
    let input = document.getElementById(inputId);
    let wrapper = document.getElementById(wrapperId);
    let label = document.querySelector(`label[for="${labelFor}"]`);

    let clickedInside = input?.contains(event.target) || wrapper?.contains(event.target);

    let clickedOnLabel = label?.contains(event.target);

    if (input && wrapper) {
      if (!clickedInside && !clickedOnLabel) {
        wrapper.classList.add("d_none");
        input.classList.remove("open");

        if (wrapperId === "contacts") {
          toggleSelectedContactsDiv();
          renderSelectedContactCircles(globalContacts);
        }
      } else if (clickedOnLabel && wrapperId === "contacts") {
        toggleSelectedContactsDiv();
        renderSelectedContactCircles(globalContacts);
      }
    }
  });
};

/** Fills dropdown with contacts and marks the selected contacts*/
async function loadContactsIntoDropdown() {
  let contacts = await fetchContacts();
  globalContacts = contacts;
  createLabels(contacts);
  setupClickHandler();
}

/** Creates a label element for a contact with a given index */
function createLabel(contact, index) {
  let color = circleColors[index % circleColors.length];

  let label = document.createElement("label");
  label.id = `contactLabel-${index}`;
  label.innerHTML = `<div id="contactChecked"><span class="circle" style="background-color: ${color};">${getInitials(contact.name)}</span>${contact.name}</div>`;
  return label;
}

/** Clears the dropdown menu for contacts and fills it with labels for each contact */
function createLabels(contacts) {
  let dropdown = document.getElementById("addTaskContactDropDown");
  dropdown.innerHTML = "";
  selected = [];

  let index = 0;
  for (let key in contacts) {
    let contact = contacts[key];
    if (contact.name) {
      selected[index] = 0;
      const label = createLabel(contact, index);
      dropdown.appendChild(label);
      index++;
    }
  }
}

/** Registers the click handler on the dropdown container for the contacts */
function setupClickHandler() {
  let dropdown = document.getElementById("addTaskContactDropDown");
  dropdown.onclick = handleDropdownClick;
}

/** Handles clicks inside the dropdown menu for the contacts */
function handleDropdownClick(event) {
  let target = event.target;

  if (target.tagName === "DIV" && target.parentElement.tagName === "LABEL") {
    target = target.parentElement;
  }

  if (target.tagName === "LABEL") {
    toggleSelection(target);
  }
}

/** Toggles the selection state of the clicked label */
function toggleSelection(label) {
  const idx = parseInt(label.id.split("-").pop(), 10);
  if (isNaN(idx)) return;

  selected[idx] = selected[idx] === 1 ? 0 : 1;
  label.classList.toggle("contactSelected", selected[idx] === 1);
}

/** Displays the selected contacts under the dropdown menu if the drop down menu is closed */
function toggleSelectedContactsDiv() {
  let container = document.getElementById("addTaskContaktsSelected");
  if (!container) return;

  if (selected.includes(1)) {
    container.classList.remove("d_none");
  } else {
    container.classList.add("d_none");
  }
}

/** Renders the selected contacts */
function renderSelectedContactCircles(contacts) {
  let container = document.getElementById("addTaskContaktsSelected");
  if (!container) return;

  container.innerHTML = "";

  let index = 0;
  for (let key in contacts) {
    const contact = contacts[key];
    if (contact.name && selected[index] === 1) {
      let color = circleColors[index % circleColors.length];
      
      let circle = document.createElement("span");
      circle.className = "circle";
      circle.textContent = getInitials(contact.name);
      circle.style.backgroundColor = color;
      container.appendChild(circle);
    }
    index++;
  }
}

/** Filters the contacts shown in the dropdown based on the input value */
function filterContacts() {
  let input = document.getElementById("addTaskContacts");
  let filterText = input.value.toLowerCase();

  let dropdown = document.getElementById("addTaskContactDropDown");
  let labels = dropdown.getElementsByTagName("label");

  let hasVisible = false;
  for (let i = 0; i < labels.length; i++) {
    let label = labels[i];
    let name = label.textContent.toLowerCase();

    if (name.includes(filterText)) {
      label.classList.remove("d_none");
      hasVisible = true;
    } else {
      label.classList.add("d_none");
    }
  }

  let contactsDiv = document.getElementById("contacts");
  if (contactsDiv) {
    contactsDiv.classList.toggle("d_none", !hasVisible);
  }
}

/** Shows or hides the selected contacts' initials below the dropdown */
function handleContactDropdownVisibility(isOpen) {
  let contactDiv = document.getElementById("addTaskContaktsSelected");
  if (!contactDiv) return;

  if (isOpen) {
    contactDiv.classList.add("d_none");
  } else {
    toggleSelectedContactsDiv();
    renderSelectedContactCircles(globalContacts);
  }
}

/** Fills dropdown with categories */
async function loadCategoriesIntoDropdown() {
  let tasks = await fetchTasks();
  createCategoryLabels(tasks);
}

/** Create a label element for a single category task */
function createCategoryLabel(task, inputField) {
  let label = document.createElement("label");
  label.innerHTML = `<div>${task.category}</div>`;

  label.addEventListener("click", () => {
    inputField.value = task.category;
    closeCategoryDropdown();
  });

  return label;
}

/** Clears the dropdown menu content for categories*/
function clearDropdown(dropdown) {
  dropdown.innerHTML = "";
}

/** Creates and inserts all category labels into the dropdown */
function createCategoryLabels(tasks) {
  let dropdown = document.getElementById("addTaskCategoryDropDown");
  let inputField = document.getElementById("addTaskCategory");

  clearDropdown(dropdown);

  let displayedCategories = new Set();

  for (let key in tasks) {
    let task = tasks[key];
    if (task.title && !displayedCategories.has(task.category)) {
      displayedCategories.add(task.category);

      let label = createCategoryLabel(task, inputField);
      dropdown.appendChild(label);
    }
  }
}

/** Closes the category dropdown */
function closeCategoryDropdown() {
  let wrapper = document.getElementById("category");
  let dropdown = document.getElementById("addTaskCategoryDropDown");
  let input = document.getElementById("addTaskCategory");

  wrapper.classList.add("d_none");
  dropdown.classList.add("d_none");
  input.classList.remove("open");

  toggleDropdownInputArrow("category", false);
}

/** Toggles the visibility of the dropdown menu for categories */
function toggleDropdownById(dropdownId) {
  let wrapper = document.getElementById(dropdownId);
  let dropdown = document.getElementById("addTaskCategoryDropDown");
  let input = document.getElementById("addTaskCategory");

  let isHidden = wrapper.classList.contains("d_none");

  if (isHidden) {
    wrapper.classList.remove("d_none");
    dropdown.classList.remove("d_none");
    input.classList.add("open");
    toggleDropdownInputArrow(dropdownId, true);
  } else {
    wrapper.classList.add("d_none");
    dropdown.classList.add("d_none");
    input.classList.remove("open");
    toggleDropdownInputArrow(dropdownId, false);
  }
}

/** Change icons within Subtask when adding content to the input*/
function changeSubtaskIcon() {
  let input = document.getElementById("addTaskSubtasks");
  let icon = document.getElementById("addTaskSubtaskConfirm");

  if (input.value.trim() === "") {
    icon.classList.add("d_none");
    icon.style.backgroundImage = "";
  } else {
    icon.classList.remove("d_none");
  }
}

/** Deletes the entered subtask in the input field */
function deleteSubtaskEntry() {
  let input = document.getElementById("addTaskSubtasks");
  input.value = "";
}

/** Confirm the entered subtask in the input field */
function confirmSubtaskEntry() {
  let input = document.getElementById("addTaskSubtasks");
  let value = input.value.trim();
  if (!value) return;

  document.getElementById("addTaskSubtaskList").classList.remove("d_none");

  document.getElementById("addTaskSubtaskList").innerHTML += confirmSubtaskEntryHTML(value);

  input.value = "";
  document.getElementById("addTaskSubtaskConfirm").classList.add("d_none");
}

/** Deletes the entered subtask under the input field */
function deleteSubtask(element) {
  element.closest("li").remove();
}

/** Edits the entered subtask under the input field */
function editSubtask(element) {
  let li;

  if (element.tagName === "LI") {
    li = element;
  } else {
    li = element.parentNode.parentNode;
  }

  let text = li.firstElementChild.textContent.replace(/^•\s*/, "").trim();
  li.outerHTML = editSubtaskHTML(text);
}

/** Deleted the entered subtask under the input field */
function trashSubtask(iconElement) {
  let wrapper = iconElement.closest(".subtaskEditWrapper");
  if (wrapper) wrapper.remove();
}

/** Saves edited subtask */
function saveSubtask(iconElement) {
  let wrapper = iconElement.parentNode.parentNode;
  let input = wrapper.firstElementChild;

  let value = input.value.trim();
  if (!value) return;

  wrapper.outerHTML = createSubtaskHTML(value);
}

/** Deletes all entries on the page */
function clearAll() {
  document.getElementById("addTaskSubtaskList").classList.add("d_none");
  document.getElementById("addTaskSubtaskList").innerHTML = "";
  document.getElementById("addTaskCategory").value = "";

  document.getElementById("urgent").classList.remove("urgent");
  document.getElementById("medium").classList.remove("medium");
  document.getElementById("low").classList.remove("low");

  document.getElementById("addTaskDate").value = "";
  document.getElementById("addTaskDescription").value = "";
  document.getElementById("addTaskTitle").value = "";

  deletesContacts();
}

/** Deletes selected contacts */
function deletesContacts() {
  for (let label of document.getElementById("addTaskContactDropDown").getElementsByTagName("label")) {
    label.classList.remove("contactSelected");
  }

  let container = document.getElementById("addTaskContaktsSelected");
  let spans = container.getElementsByTagName("span");

  for (let i = spans.length - 1; i >= 0; i--) {
    spans[i].remove();
  }

  container.style.display = "none";
}

/** Gets entered information */
function getTaskInformation() {
  let title = document.getElementById("addTaskTitle").value;
  let description = document.getElementById("addTaskDescription").value;
  let duedate = document.getElementById("addTaskDate").value;
  let category = document.getElementById("addTaskCategory").value;

  let priority = selectedPriority ? selectedPriority.charAt(0).toUpperCase() + selectedPriority.slice(1) : "";

  let assigned = getTaskContactsInformation();
  let subtasks = getTaskSubtaskInformation();

  return {title, description, duedate, category, priority, assigned, subtasks, };
}

/** Gets selected contacts */
function getTaskContactsInformation() {
  let assigned = [];
  let keys = Object.keys(globalContacts);

  for (let i = 0; i < keys.length; i++) {
    if (selected[i] == 1) {
      let contact = globalContacts[keys[i]];
      assigned.push(contact.name);
    }
  }
  return assigned;
}

/** Gets entered subtasks */
function getTaskSubtaskInformation() {
  let subtaskListElement = document.getElementById("addTaskSubtaskList");
  let subtasks = [];

  for (let i = 0; i < subtaskListElement.children.length; i++) {
    let li = subtaskListElement.children[i];
    let text = li.textContent.replace(/^[•\.\-\*\s]+/, "").trim();
    subtasks.push(text);
  }

  return subtasks;
}

/** Saves new task */
async function saveNewTask(event) {
  event.preventDefault();

  let { title, description, duedate, category, priority, assigned, subtasks } =
    getTaskInformation();

  if (!required(event)) {
    return;
  }


  let newTask = {title, description, duedate, category, priority, assigned, subtasks, id: "to_do"};

  await loadTaskIntoAPI(newTask);

  clearAll();

  document.getElementById("addTaskSuccessful").classList.remove("d_none");

  setTimeout(() => {
    window.location.href = "./board.html";
  }, 1000);
}

/** Loads task data into the API */
async function loadTaskIntoAPI(newTask) {
  let lastIdRes = await fetch(`${BASE_URL}/tasks/lastTaskId.json`);
  let lastId = parseInt(await lastIdRes.json()) || 0;

  let nextId = lastId + 1;
  let newTaskKey = `task${nextId}`;

  await fetch(`${BASE_URL}/tasks/${newTaskKey}.json`, {
    method: "PUT",
    body: JSON.stringify(newTask),
  });

  await fetch(`${BASE_URL}/tasks/lastTaskId.json`, {
    method: "PUT",
    body: JSON.stringify(nextId),
  });
}
