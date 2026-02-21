/** Generates HTML string for a new subtask entry in the list.
 * @param {string} value - The subtask text.
 * @returns {string} HTML string for a <li> element. */
function confirmSubtaskEntryHTML(value) {
  return `
    <li class="addTaskSubtaskItem" ondblclick="editSubtask(this)">
      <span>&#8226;&nbsp;&nbsp;&nbsp;${value}</span>
      <div class="editIconsAlignment">
        <img class="editIcon" src="../assets/icons/pencil.svg" alt="pencil" onclick="editSubtask(this)">
        <div class="addTaskSubtaskLine"></div>
        <img class="editIcon" src="../assets/icons/trash.svg" alt="trash" onclick="deleteSubtask(this)">
      </div>
    </li>
  `;
}

/** Generates HTML string for a subtask in edit mode.
 * @param {string} text - The text of the subtask.
 * @returns {string} HTML string for a div with input and action icons. */
function editSubtaskHTML(text) {
  return `
    <div class="subtaskEditWrapper">
      <input class="subtaskEdit" type="text" value="${text}">
      <div class="editIconsAlignmentVisible">
        <img src="../assets/icons/trash_black.svg" class="editIcon" onclick="trashSubtask(this)">
        <div class="addTaskSubtaskLine"></div>
        <img src="../assets/icons/check_black.svg" class="editIcon" onclick="saveSubtask(this)">
      </div>
    </div>
  `;
}

/** Generates HTML string for a subtask item (same as confirmSubtaskEntryHTML).
 * @param {string} value - The subtask text.
 * @returns {string} HTML string for a <li> element. */
function createSubtaskHTML(value) {
  return `
    <li class="addTaskSubtaskItem" ondblclick="editSubtask(this)">
      <span>&#8226;&nbsp;&nbsp;&nbsp;${value}</span>
      <div class="editIconsAlignment">
        <img class="editIcon" src="../assets/icons/pencil.svg" alt="pencil" onclick="editSubtask(this)">
        <div class="addTaskSubtaskLine"></div>
        <img class="editIcon" src="../assets/icons/trash.svg" alt="trash" onclick="deleteSubtask(this)">
      </div>
    </li>
  `;
}

/** Generates HTML string for a contact label in the dropdown.
 * @param {Object} contact - The contact object.
 * @param {string} color - The color to use for the avatar circle.
 * @returns {string} HTML string representing a contact label. */
function contactLabelTemplate(contact, color) {
  return `
    <div id="contactChecked">
      <span class="circle" style="background-color: ${color};">${getInitials(contact.name)}</span>
      ${contact.name}
    </div>
  `;
}
