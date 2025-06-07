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
