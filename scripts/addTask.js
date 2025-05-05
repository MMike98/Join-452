/** Check if the required input is available */
function checkField(fieldId, errorId, isDiv = false) {
  let field = document.getElementById(fieldId);
  let error = document.getElementById(errorId);

  if (isDiv) {
    let checkboxContainer = document.getElementById("addTaskCategory");
    let checked = checkboxContainer.querySelectorAll('input[type="checkbox"]:checked');

    if (checked.length === 0) {
      showError(field, error);
      return false;
    }
  } else {
    if (field.value === "") {
      showError(field, error);
      return false;
    }
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
  let isCategoryValid = checkField("categorySelector", "addTaskCategoryError", true);

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








// Dropdowns schließen, wenn außerhalb geklickt wird
window.addEventListener("click", function (e) {
  const dropdownContact = document.getElementById("addTaskContact");
  const selectBoxContact = document.querySelector(
    '.addTaskSelectBox[onclick="toggleContactDropdown()"]'
  );

  const dropdownCategory = document.getElementById("addTaskCategory");
  const selectBoxCategory = document.querySelector(
    '.addTaskSelectBox[onclick="toggleCategoryDropdown()"]'
  );

  if (
    selectBoxContact &&
    dropdownContact &&
    !selectBoxContact.contains(e.target) &&
    !dropdownContact.contains(e.target)
  ) {
    dropdownContact.style.display = "none";
  }

  if (
    selectBoxCategory &&
    dropdownCategory &&
    !selectBoxCategory.contains(e.target) &&
    !dropdownCategory.contains(e.target)
  ) {
    dropdownCategory.style.display = "none";
  }
});

// Beim Laden der Seite die Dropdowns mit den Daten füllen
document.addEventListener("DOMContentLoaded", function () {
  loadContactsIntoDropdown(); // Lädt die Kontakte in das Dropdown
  loadCategoriesIntoDropdown(); // Lädt die Aufgaben (Tasks) in das Dropdown
});
