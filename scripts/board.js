// SCRIPT FOR BOARD //

let currentDraggedElement;

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
  <div draggable="true" ondragstart="startDragging(${task.id})" class="card" id="${task.id}">
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
/*
 function updateHTML() {
    let to_do = task.filter(t => t['category'] == 'open');

    document.getElementById('open').innerHTML = '';

    for (let index = 0; index < to_do.length; index++) {
        const element = to_do[index];
        document.getElementById('open').innerHTML += generateTodoHTML(element);
    }

    let in_progress = task.filter(t => t['category'] == 'in_progress');

    document.getElementById('in_progress').innerHTML = '';

    for (let index = 0; index < in_progress.length; index++) {
        const element = closed[index];
        document.getElementById('in_progress').innerHTML += generateTodoHTML(element);
    }

       let await_feedback = task.filter(t => t['category'] == 'closed');

    document.getElementById('closed').innerHTML = '';

    for (let index = 0; index < closed.length; index++) {
        const element = closed[index];
        document.getElementById('closed').innerHTML += generateTodoHTML(element);
    }
} 
*/

function updateHTML() {
    const statuses = ['to_do', 'in_progress', 'await_feedback', 'done'];

    for (let status of statuses) {
        let filteredTasks = task.filter(t => t['status'] === status);

        document.getElementById(status).innerHTML = '';

        for (let index = 0; index < filteredTasks.length; index++) {
            const task = filteredTasks[index];
            document.getElementById(status).innerHTML += generateTaskHTML(task);
        }
    }
}


function startDragging(id) {
currentDraggedElement = id;
}

function allowDrop(ev) {
    ev.preventDefault();
}

function moveTo(status) {
  task[currentDraggedElement]['status'] = status;
  updateHTML();
}