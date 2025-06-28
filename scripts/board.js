// SCRIPT FOR BOARD //*css*/`
    
// Über "add task" muss eine card im board generiert werden.
// über "savenewtask" im add task code html generierung für die card triggern
// to_do , in_progress divs müssen "dropable" sein
// css aufräumen
// verknüpfung mit summary
// Container in der die "cards" hereingeneriert werden: "to_do" 
// (Jeder Task startet mit dem Status "to_do")


function renderTaskCards(tasks) {
  for (let key in tasks) {
    const task = tasks[key]; // Das eigentliche Task-Objekt
    renderSingleTaskCard(task); // Hier wird die Card erstellt
  }
}

function renderSingleTaskCard(task) {
  const boardColumn = document.getElementById("to_do_column"); //
  const card = document.createElement("div");
  card.classList.add("task-card");

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
