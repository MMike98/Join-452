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
  updateFirebase(currentDraggedElement, status).catch(error => {
    console.error('Fehler beim Firebase-Update:', error);
    
  });
}

function drop(ev, newStatus) {
  ev.preventDefault(); 
  moveTo(newStatus);
}

async function updateFirebase(taskId, newStatus) {
  const url = `${BASE_URL}/tasks/${taskId}.json`;
  const payload = { status: newStatus };

  try {
    await fetch(url, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log(`Status für Task ${taskId} auf '${newStatus}' aktualisiert.`);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Status in Firebase:', error);
    throw error; 
  } 
}

function dynamicPriorityIcon(priority) {
  const formatted = priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
  return `../assets/icons/Priority ${formatted}.svg`;
}

function generateAssignedUsers(assigned) {
  return assigned
    .map(name => {
      const initials = getInitials(name);
      const color = getColorForName(name);
      return `
        <div class="profile-icon" style="background-color: ${color}">
          ${initials}
        </div>
      `;
    })
    .join('');
}

function getInitials(name) {
  const parts = name.trim().split(' ');
  const initials = parts.map(p => p[0]).slice(0, 2).join('');
  return initials.toUpperCase();
}

function getColorForName(name) {
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 60%)`; 
}
