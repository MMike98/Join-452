// SCRIPT FOR BOARD //

async function initBoard() {
  const tasks = await fetchTasks(); 
  renderTaskCards(tasks);          
}

window.addEventListener("load", initBoard);

function renderTaskCards(tasks) {
  for (let key in tasks) {
    const task = tasks[key]; 
    renderSingleTaskCard(task); 
  }
}

function renderSingleTaskCard(task) {
  const boardColumn = document.getElementById("to_do"); 
  const card = document.createElement("div");
  card.classList.add("card");

  card.innerHTML = `
  <div draggable="true" ondragstart="startDragging()" class="card" id="${task.id}">
                        <div class="card-content">
                            <div class="card-header">
                                <p class="blue">${task.category}</p>
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
                                    <img src="../assets/icons/Profile badge.svg" alt="Profile">
                                    <img src="../assets/icons/Profile badge.svg" alt="Profile">
                                    <img src="../assets/icons/Profile badge.svg" alt="Profile">
                                </div>
                                <div class="priority"> <!-- PRIORITY -->
                                    <img src="../assets/icons/Priority Medium.svg" alt="Priority">
                                </div>
                            </div>
                        </div>
                    </div>
  `;

  boardColumn.appendChild(card);
}

