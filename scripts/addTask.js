/** Check if the required input is available */
function checkField(fieldId, errorId, isDiv = false) {
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
  field.classList.add("inputError");
  errorElement.style.display = "block";
}

/** If the required information is available, remove the error message */
function hideError(field, errorElement) {
  field.classList.remove("inputError");
  errorElement.style.display = "none";
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

/** Displays dropdown menu for contacts and category */
function toggleDropdownById(dropdownId) {
  let dropdown = document.getElementById(dropdownId);

  if (dropdown.style.display === "block") {
    dropdown.style.display = "none";
  } else {
    dropdown.style.display = "block";
  }
}

/** Fill the dropdowns with the data when loading the page */
window.onload = function () {
  loadContactsIntoDropdown();
  loadCategoriesIntoDropdown();
};

/** Closes all dropdowns when clicking somewhere else outside the menu */
window.onclick = function (event) {
  let dropdowns = document.querySelectorAll(".addTaskDropDown");

  dropdowns.forEach(function (dropdown) {
    let selectBox = dropdown.previousElementSibling; // Das Eingabefeld (die Box, die das Dropdown auslöst)

    // Wenn der Klick außerhalb des Eingabefelds und des Dropdowns war, schließen wir das Dropdown
    if (!selectBox.contains(event.target) && !dropdown.contains(event.target)) {
      dropdown.style.display = "none";
    }
  });
};
