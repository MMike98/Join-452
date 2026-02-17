function generateTaskHTML(task, key, categoryClass = "default") {
  const openSubtasks = task.subtasks?.length || 0;
  const doneSubtasks = task.subtasksDone?.length || 0;
  const totalSubtasks = openSubtasks + doneSubtasks;

  const progress =
    totalSubtasks === 0 ? 0 : (doneSubtasks / totalSubtasks) * 100;

  const progressHTML =
    totalSubtasks > 0
      ? `
        <div class="card-progress">
          <div class="progress-bar">
            <div class="progress-bar-content" style="width:${progress}%"></div>
          </div>
          <p>${doneSubtasks}/${totalSubtasks} Subtasks</p>
        </div>
      `
      : "";

  return `
    <div draggable="true"
      ondragstart="startDragging('${key}')"
      class="card"
      id="card-${key}"
      data-key="${key}">
      
      <div class="card-content">
        <div class="card-header">
          <p class="${categoryClass}">${task.category}</p>
        </div>

        <div class="card-body">
          <h3>${task.title}</h3>
          <p>${task.description}</p>
        </div>

        ${progressHTML}

        <div class="card-footer">
          <div class="profile">
            ${generateAssignedUsers(task.assigned)}
          </div>
          <div class="priority">
            <img src="${dynamicPriorityIcon(task.priority)}" alt="Priority">
          </div>
        </div>
      </div>
    </div>
  `;
}

function generateInfoTaskHTML(t, key) {
  let categoryClass = getCategoryClass(t.category); 
  let dueDateFormatted = formatDate(t.duedate);

  return `
    <div class="infoTaskContent">
      <div class="card-header">
        <p class="${categoryClass}" id="info-card-${key}">${t.category}</p>
        <img src="../assets/icons/cross.svg" alt="close"
             class="overlayClose overlayCloseInfoAlignment"
             onclick="closeOverlay()">
      </div>
      <div class="infoTaskScroll">
        <h1>${t.title}</h1>
        <div class="infoCardDescription">${t.description}</div>
        <table class="infoTaskTable">
          <tr>
            <td>Due date:</td>
            <td>${dueDateFormatted}</td>
          </tr>
          <tr>
            <td>Priority:</td>
            <td>${t.priority}
              <span class="priority-icon-wrapper">
                <img src="${dynamicPriorityIcon(t.priority)}"
                     alt="Priority"
                     class="priority-icon">
              </span>
            </td>
          </tr>
        </table>
        <div>
          <div class="intoTaskText">Assigned To:</div>
          <table class="infoContactsTable">
            ${
              t.assigned?.length
                ? t.assigned
                    .map(
                      (name) => `
                        <tr>
                          <td class="contact-icon-cell">${generateAssignedUsers([name])}</td>
                          <td class="contact-name-cell">${name}${
                            isYou(name) ? ' <span>(You)</span>' : ''
                          }</td>
                        </tr>`
                    )
                    .join("")
                : "<tr><td colspan='2'>No contacts</td></tr>"
            }
          </table>
        </div>
        <div class="intoTaskText">Subtasks:
        <ul>
          ${
            (
              (t.subtasks?.length
                ? t.subtasks
                    .map(
                      (s, i) => `
                        <div class="checkPP">
                          <input type="checkbox"
                                 class="checkBox"
                                 id="checkPP-${i}"
                                 name="checkPP"
                                 value="${s.title || s}"
                                 onchange="toggleSubtask('${key}', '${s.title || s}', this.checked)">
                          <label for="checkPP-${i}" class="custom-checkbox">
                            <span class="checkbox-icon"></span>
                            <h5>${s.title || s}</h5>
                          </label>
                        </div>`
                    )
                    .join("")
                : "") +
              (t.subtasksDone?.length
                ? t.subtasksDone
                    .map(
                      (s, i) => `
                        <div class="checkPP">
                          <input type="checkbox"
                                 class="checkBox"
                                 id="checkDone-${i}"
                                 name="checkPP"
                                 value="${s.title || s}"
                                 checked
                                 onchange="toggleSubtask('${key}', '${s.title || s}', this.checked)">
                          <label for="checkDone-${i}" class="custom-checkbox">
                            <span class="checkbox-icon"></span>
                            <h5>${s.title || s}</h5>
                          </label>
                        </div>`
                    )
                    .join("")
                : "")
            ) || "<li class='noSubTasks'>No subtasks</li>"
          }
        </ul>
        </div>
      </div>
      <div class="infoTaskButtons">
        <button class="deleteButton" onclick="DeleteTask('${key}')">
          <img src="../assets/icons/trash_black.svg" alt="delete">Delete
        </button>
        <div class="line"></div>
        <button class="editButton" onclick="editTask('${key}')">
          <img src="../assets/icons/edit.svg" alt="edit">Edit
        </button>
      </div>
    </div>
  `;
}

function emptyColumnTemplate(message) {
  return `<div class="no-task"><p>${message}</p></div>`;
}

function editContactLabelTemplate(contact, color, selected) {
  const selectedClass = selected ? "contactSelected" : "";
  const initials = getInitials(contact.name);
  return `
    <label class="${selectedClass}">
      <div class="contact-item">
        <span class="circle" style="background-color:${color}">${initials}</span>
        ${contact.name}
      </div>
    </label>
  `;
}

function editContactInnerHTML(contact, selected) {
  const color = getColorForName(contact.name);
  const initials = getInitials(contact.name);
  const checkboxSrc = selected
    ? "../assets/icons/checkbox-checked.svg"
    : "../assets/icons/checkbox-empty.svg";

  return `
    <div style="display:flex; align-items:center; gap:8px;">
      <span class="circle" style="background-color:${color}">${initials}</span>
      <span class="contact-name">${contact.name}</span>
    </div>
    <img class="contact-checkbox" src="${checkboxSrc}" alt="checkbox">
  `;
}

function editContactCircleHTML(contact) {
  return `<span class="circle circleEdit" style="background-color:${getColorForName(contact.name)}">
    ${getInitials(contact.name)}
  </span>`;
}

function activeSubtaskTemplate(subtask, index) {
  return `<li class="subtask-item">
    <div class="subtask-content"><span>${subtask}</span></div>
    <div class="subtask-actions">
      <img src="../assets/icons/edit.svg" onclick="startEditEditSubtask(${index}, false)">
      <img src="../assets/icons/delete.svg" onclick="deleteEditSubtask(${index}, false)">
    </div>
  </li>`;
}

function doneSubtaskTemplate(subtask, index) {
  return `<li class="subtask-item done">
    <div class="subtask-content"><span>${subtask}</span></div>
    <div class="subtask-actions">
      <img src="../assets/icons/edit.svg" onclick="startEditEditSubtask(${index}, true)">
      <img src="../assets/icons/delete.svg" onclick="deleteEditSubtask(${index}, true)">
    </div>
  </li>`;
}

function editSubtaskTemplate(text, index, done = false) {
  return `
    <div class="subtask-wrapper subtask-wrapper-edit">
      <input type="text"
             class="subtaskEdit editStyle"
             value="${text}"
             onkeydown="handleEditSubtaskKey(event, ${index}, ${done})"
             onblur="confirmEditSubtaskEntry(${index}, this.value, ${done})">

      <div class="addTaskSubtaskConfirm">
        <img src="../assets/icons/trash_black.svg"
             onclick="deleteEditSubtask(${index}, ${done})">
        <div class="addTaskSubtaskLine"></div>
        <img src="../assets/icons/confirm.svg"
             onclick="confirmEditSubtaskEntry(${index}, this.closest('.subtask-wrapper').querySelector('input').value, ${done})">
      </div>
    </div>
  `;
}
