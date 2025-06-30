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
  const boardColumn = document.getElementById(task.status); 
  if (!boardColumn) return;  

  
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = generateTaskHTML(task).trim(); 

  const cardElement = tempDiv.firstChild;  

  
  boardColumn.appendChild(cardElement);
}


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

function drop(ev, newStatus) {
  ev.preventDefault(); 
  moveTo(newStatus);
}