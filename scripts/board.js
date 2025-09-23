let currentDraggedElement;
let task = {};
let contactIndexMap = {};

/** Initializes the board by fetching tasks and contacts, building the contact index map, and updating the HTML. */
async function initBoard() {
  task = await fetchTasks();

  let contacts = await fetchContacts();
  
  buildContactIndexMap(contacts);
  setupSearch();
  updateHTML();
  setupDropzoneHighlight();
}

/** Builds a map from contact names to indices based on sorted first names. Filters invalid contacts and returns sorted array. */
function buildContactIndexMap(contacts) {
  let contactsArray = Array.isArray(contacts) ? contacts : Object.values(contacts);
  let validContacts = contactsArray.filter(c => c.name && typeof c.name === 'string');

  let sortedContacts = validContacts.sort((a, b) => {
    let firstNameA = a.name.split(' ')[0].toLowerCase();
    let firstNameB = b.name.split(' ')[0].toLowerCase();
    return firstNameA.localeCompare(firstNameB);
  });

  contactIndexMap = {};
  sortedContacts.forEach((contact, index) => {contactIndexMap[contact.name] = index;});

  return sortedContacts;
}

/** Updates all task columns in the UI based on current task data. */
function updateHTML(query = '') {
  const statuses = ['to_do', 'in_progress', 'await_feedback', 'done'];

  statuses.forEach(status => {
    const tasksInStatus = Object.entries(task)
      .filter(([_, t]) => t.status === status)
      .filter(([_, t]) => {
        if (!query) return true;
        return t.title?.toLowerCase().includes(query.toLowerCase());
      });

    updateColumn(status, tasksInStatus);
  });
}

/** Updates a single column based on its task status. */
function updateColumn(status, tasks) {
  const column = document.getElementById(status);
  column.innerHTML = '';

  if (tasks.length === 0) {
    column.innerHTML = generateEmptyColumnHTML(status);
    return;
  }

  for (const [key, t] of tasks) {
    const categoryClass = getCategoryClass(t.category);
    column.innerHTML += generateTaskHTML(t, key, categoryClass);
  }
}

/** Returns the fallback "no tasks" HTML used for all empty columns. */
function generateEmptyColumnHTML(status) {
 const statusMessages = {
    to_do: 'No tasks To Do',
    in_progress: 'No tasks In Progress',
    await_feedback: 'No tasks Await Feedback',
    done: 'No tasks Done',
  };

  return `
    <div class="no-task">
      <p>${statusMessages[status]}</p>
    </div>
  `;
}

/** Starts dragging a task. */
function startDragging(id) {
  currentDraggedElement = id;
}

/** Allows drop by preventing default event. */
function allowDrop(ev) {
  ev.preventDefault();
}

/** Moves the currently dragged task to a new status and updates Firebase. */
async function moveTo(status, key) {
  task[key]['status'] = status;

  try {
    await updateFirebase(key, status);
  } catch (error) {
    console.error('Error updating status in Firebase:', error);
  }

  updateHTML();
}

/** Handles drop event to move task to new status. */
// function drop(ev, newStatus) {
 // ev.preventDefault();
//  moveTo(newStatus);
// }

function drop(ev, newStatus) {
  ev.preventDefault();

const card = document.getElementById(`card-${currentDraggedElement}`);
if (!card) return;

const key = card.dataset.key; 
moveTo(newStatus, key);

  // Wiggle-Effekt
  card.classList.add("wiggle");
  card.addEventListener("animationend", () => {
    card.classList.remove("wiggle");
  }, { once: true });
}

/** Updates the task status in Firebase. */
async function updateFirebase(taskId, newStatus) {
  let url = `${BASE_URL}/tasks/${taskId}.json`;
  let payload = { status: newStatus };

  try {
    await fetch(url, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    console.log(`Status for Task ${taskId} updated to '${newStatus}'.`);
  } catch (error) {
    console.error('Error updating Firebase:', error);
    throw error;
  }
}

/** Returns CSS class for a given task category. */
function getCategoryClass(category) {
  if (!category) return 'default';

  switch(category.toLowerCase().trim()) {
    case 'call':
      return 'blue';
    case 'user story':
      return 'green';
    default:
      return 'default';
  }
}

/** Generates HTML for assigned users with color-coded initials. */
function generateAssignedUsers(assigned) {
  if (!assigned || !Array.isArray(assigned)) return '';

  // filtra só nomes válidos
  const validUsers = assigned.filter(
    name => typeof name === 'string' && name.trim() !== ''
  );

  const maxVisible = 4;
  const visibleUsers = validUsers.slice(0, maxVisible);
  const remaining = validUsers.length - maxVisible;

  let html = visibleUsers.map(name => {
    let initials = getInitials(name);
    let color = getColorForName(name);
    return `
      <div class="profile-icon" style="background-color: ${color}">
        ${initials}
      </div>
    `;
  }).join('');

  if (remaining > 0) {
    html += `
      <div class="profile-icon" style="background-color: black">
        +${remaining}
      </div>
    `;
  }

  return html;
}


/** Returns a color string for a contact name based on its index in contactIndexMap. */
function getColorForName(name) {
  let index = contactIndexMap[name] ?? 0;
  return circleColors[index % circleColors.length];
}

/** Returns the file path for a priority icon image. */
function dynamicPriorityIcon(priority) {
  let formatted = priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
  return `../assets/icons/Priority ${formatted}.svg`;
}

/** Sets up the search input to filter tasks as the user types. */
function setupSearch() {
  const input = document.getElementById('searchBoard');
  if (!input) return; 

  input.addEventListener('input', (event) => {
    currentQuery = event.target.value.trim().toLowerCase();
    updateHTML(currentQuery); 
  });
}

/**
 * Öffnet den Add-Task-Slider und initialisiert ihn. */
async function openAddTaskSlider() {
  const slider = document.getElementById("addTaskSlider");
  const panel = slider.querySelector(".overlay");

  slider.classList.remove("d_none");

  requestAnimationFrame(() => {
    slider.classList.add("active");
    panel.classList.add("open");
  });

    await initAddTaskSlider();
}


/**  Schließt den Add-Task-Slider mit Animation. */
function closeAddTaskSlider(event) {
  const slider = document.getElementById("addTaskSlider");
  const panel = slider.querySelector(".overlay");

  panel.classList.remove("open"); 
  slider.classList.remove("active"); 

  
  setTimeout(() => {
    slider.classList.add("d_none");
  }, 350);
}


/** Behandelt das Erstellen einer neuen Aufgabe, speichert sie und schließt den Slider. */
async function handleCreateTask(event) {
  try {
    await saveNewTask(event);
  } catch (err) {
    console.error(err);
  } finally {
    closeAddTaskSlider(event);
  }
  
  setTimeout(() => {
    window.location.href = "./board.html";
  }, 800); 
}


/**  Initialisiert den Add-Task-Slider, lädt Kontakte, Kategorien und rendert die ausgewählten Kontakte.  */
async function initAddTaskSlider() {
  clearAll();                       
  showUserInitial();                
  let contacts = await loadContactsIntoDropdown(); 
   console.log('contacts in initAddTaskSlider:', contacts);
  setupClickHandler();
  await loadCategoriesIntoDropdown(); 
  renderSelectedContactCircles(contacts);  
}


/** Opens Overlay for AddTask */
function openAddTaskOverlay() {
  if (window.innerWidth >= 1400) {
    let overlay = document.getElementById("addTaskBoard");
    if (overlay) {
      overlay.classList.add("open");
      init();
    }
  } else {
    window.location.href = "addtask.html";
  }
}

/** Sets up visual feedback for drag-and-drop operations on task columns. */
function setupDropzoneHighlight() {
  const columnIds = ['to_do', 'in_progress', 'await_feedback', 'done'];
  const overCounters = new WeakMap();

  columnIds.forEach(id => {
    const col = document.getElementById(id);

    overCounters.set(col, 0);

    col.addEventListener('dragenter', (e) => {
      overCounters.set(col, overCounters.get(col) + 1);
      col.classList.add('drop-target');
    });

    col.addEventListener('dragleave', () => {
      const n = overCounters.get(col) - 1;
      overCounters.set(col, n);
      if (n <= 0) {
        col.classList.remove('drop-target');
        overCounters.set(col, 0);
      }
    });

    col.addEventListener('drop', () => {
      col.classList.remove('drop-target');
      overCounters.set(col, 0);
    });
  });
}