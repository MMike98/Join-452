// SCRIPT FOR BOARD //

let currentDraggedElement;
let task = {};

async function initBoard() {
  task = await fetchTasks(); 
  renderTaskCards(task);          
}

window.addEventListener("load", initBoard);

function renderTaskCards(tasks) {
  for (let key in tasks) {
    const taskObj = tasks[key]; 
    renderSingleTaskCard(taskObj, key); 
  }
}


function renderSingleTaskCard(taskObj, key) {
  const boardColumn = document.getElementById(taskObj.status);
  if (!boardColumn) return;

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = generateTaskHTML(taskObj, key).trim();

  const cardElement = tempDiv.firstChild;
  boardColumn.appendChild(cardElement);
}


function updateHTML() {
  const statuses = ['to_do', 'in_progress', 'await_feedback', 'done'];

  for (let status of statuses) {
    const column = document.getElementById(status);
    column.innerHTML = '';

    for (let key in task) {
      if (task[key].status === status) {
        column.innerHTML += generateTaskHTML(task[key], key);
      }
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