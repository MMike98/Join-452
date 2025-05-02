
/** Check if the required input is available */
function checkField(fieldId, errorId) {
    let field = document.getElementById(fieldId);
    let error = document.getElementById(errorId);

    if (field.value === "") {
        showError(field, error);
        return false;
    } else {
        hideError(field, error);
        return true;
    }
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
    let priorities = ['urgent', 'medium', 'low'];
  
    priorities.forEach(prio => {
      let button = document.getElementById(prio);
      let notActiveImg = document.getElementById(prio + 'NotActive');
      let activeImg = document.getElementById(prio + 'Active');
  
      notActiveImg.classList.remove('d_none');
      activeImg.classList.add('d_none');
      button.classList.remove(prio);
  
      if (prio === priority) {
        notActiveImg.classList.add('d_none');
        activeImg.classList.remove('d_none');
        button.classList.add(prio);
      }
    });
  }

  
  
  
  
  




