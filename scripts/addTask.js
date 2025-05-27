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

/** Displays dropdown menu for contacts and category and change arrow*/
function toggleDropdownById(dropdownId) {
  let dropdown = document.getElementById(dropdownId);

  dropdown.classList.toggle("d_none");

  let inputId = dropdownId === "contacts" ? "addTaskContacts" : "addTaskCategory";
  let input = document.getElementById(inputId);
  
  input.classList.toggle("open", !dropdown.classList.contains("d_none"));
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
    }
  });
};

