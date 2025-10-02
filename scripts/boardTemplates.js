function generateTaskHTML(task, key, categoryClass = "default") {
  const totalSubtasks =
    (task.subtasks ? task.subtasks.length : 0) +
    (task.subtasksDone ? task.subtasksDone.length : 0);

  const doneSubtasks = task.subtasksDone ? task.subtasksDone.length : 0;

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
        <div class="card-progress">
          <div class="progress-bar">
            <div class="progress-bar-content" style="width:${
              (doneSubtasks / (totalSubtasks || 1)) * 100
            }%"></div>
          </div>
          <p>${doneSubtasks}/${totalSubtasks} Subtasks</p>
        </div>
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
