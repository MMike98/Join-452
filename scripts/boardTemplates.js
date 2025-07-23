function generateTaskHTML(task, key, categoryClass = 'default') {
  return `
    <div draggable="true" ondragstart="startDragging('${key}')" class="card" id="${task.id}">
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
            <div class="progress-bar-content" style="width:50%"></div>
          </div>
          <p>1/2 Subtasks</p>
        </div>
        <div class="card-footer">
          <div class="profile"> <!-- ASSIGNED TO -->
            ${generateAssignedUsers(task.assigned)}
          </div>
          <div class="priority"> <!-- PRIORITY -->
            <img src="${dynamicPriorityIcon(task.priority)}" alt="Priority">
          </div>
        </div>
      </div>
    </div>
  `;
}
