let selected = [];
let globalContacts = [];

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

  priorities.forEach((prio) => {
    let button = document.getElementById(prio);
    let notActiveImg = document.getElementById(prio + "NotActive");
    let activeImg = document.getElementById(prio + "Active");

    notActiveImg.classList.remove("d_none");
    activeImg.classList.add("d_none");
    button.classList.remove(prio);

    if (prio === priority) {
      notActiveImg.classList.add("d_none");
      activeImg.classList.remove("d_none");
      button.classList.add(prio);
    }
  });
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

/** Rotates the arrow in the dropdown when the menu is open */
function toggleDropdownInputArrow(dropdownId, isOpen) {
  let inputId = dropdownId === "contacts" ? "addTaskContacts" : "addTaskCategory";
  let input = document.getElementById(inputId);
  input.classList.toggle("open", isOpen);
}

/** Closes all dropdowns when clicking somewhere else outside the menu */
window.onclick = function(event) {
  let dropdowns = [
    { inputId: "addTaskContacts", wrapperId: "contacts" },
    { inputId: "addTaskCategory", wrapperId: "category" }
  ];

  dropdowns.forEach(({ inputId, wrapperId }) => {
    let input = document.getElementById(inputId);
    let wrapper = document.getElementById(wrapperId);

    if (input && wrapper && !input.contains(event.target) && !wrapper.contains(event.target)) {
      wrapper.classList.add("d_none");
      input.classList.remove("open");

      if (wrapperId === "contacts") {
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
  let label = document.createElement("label");
  label.id = `contactLabel-${index}`;
  label.innerHTML = `<div id="contactChecked"><span class="circle">${getInitials(contact.name)}</span>${contact.name}</div>`;
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
      let circle = document.createElement("span");
      circle.className = "circle";
      circle.textContent = getInitials(contact.name);
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

  for (let i = 0; i < labels.length; i++) {
    let name = labels[i].textContent.toLowerCase();
    if (name.includes(filterText)) {
      labels[i].classList.remove("d_none");
    } else {
      labels[i].classList.add("d_none");
    }
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
  label.innerHTML = `<div>${task.title}</div>`;

  label.addEventListener("click", () => {
    inputField.value = task.title;
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

  for (let key in tasks) {
    let task = tasks[key];
    if (task.title) {
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





function confirmSubtaskEntry() {
  let input = document.getElementById("addTaskSubtasks");
  let value = input.value.trim();
  if (!value) return;

  document.getElementById("addTaskSubtaskList").classList.remove("d_none");

  let subtask = document.createElement("li");
  subtask.className = "addTaskSubtaskItem";
  subtask.textContent = value;
  document.getElementById("addTaskSubtaskList").appendChild(subtask);

  input.value = "";
  document.getElementById("addTaskSubtaskConfirm").classList.add("d_none");
}




