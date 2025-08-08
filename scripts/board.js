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
async function moveTo(status) {
  task[currentDraggedElement]['status'] = status;

  try {
    await updateFirebase(currentDraggedElement, status);
  } catch (error) {
    console.error('Error updating status in Firebase:', error);
  }

  updateHTML();
}

/** Handles drop event to move task to new status. */
function drop(ev, newStatus) {
  ev.preventDefault();
  moveTo(newStatus);
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

  return assigned.filter(name => typeof name === 'string' && name.trim() !== '').map(name => {
      let initials = getInitials(name);
      let color = getColorForName(name);
      return `
        <div class="profile-icon" style="background-color: ${color}">
          ${initials}
        </div>
      `;
    })
    .join('');
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

/**  */
function setupSearch() {
  const input = document.getElementById('searchBoard');
  if (!input) return; 

  input.addEventListener('input', (event) => {
    currentQuery = event.target.value.trim().toLowerCase();
    updateHTML(currentQuery); 
  });
}

async function openAddTaskSlider() {
  const slider = document.getElementById("addTaskSlider");
  const panel = slider.querySelector(".overlay");

  slider.classList.remove("d_none");

  // Slider animiert rein
  requestAnimationFrame(() => {
    slider.classList.add("active");
    panel.classList.add("open");
  });

  // Initialisiere das Formular im Slider
  await initAddTaskSlider();
}

function closeAddTaskSlider(event) {
  const slider = document.getElementById("addTaskSlider");
  const panel = slider.querySelector(".overlay");

  panel.classList.remove("open"); // Slide raus
  slider.classList.remove("active"); // grauer Hintergrund entfernen sofort

  // Nach 350ms → d_none setzen (nachdem Animation fertig)
  setTimeout(() => {
    slider.classList.add("d_none");
  }, 350);
}




async function initAddTaskSlider() {
  clearAll();                       // Eingabefelder zurücksetzen (wenn nötig)
  showUserInitial();                // User-Kürzel setzen, falls gebraucht
  await loadContactsIntoDropdown(); // Kontakte laden und Dropdown füllen
  await loadCategoriesIntoDropdown(); // Kategorien laden und Dropdown füllen
}



