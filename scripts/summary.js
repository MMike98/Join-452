// SCRIPT FOR SUMMARY //
    

async function loadTasksAndCount() {
  try {
    const response = await fetch(`${BASE_URL}/tasks.json`);
    const data = await response.json();

    let counts = {
      total: 0,
      to_do: 0,
      in_progress: 0,
      await_feedback: 0,
      done: 0,
    };

    for (let key in data) {
      const task = data[key];
      if (counts.hasOwnProperty(task.status)) {
        counts[task.status]++;
      }
      counts.total++;
    }

    renderTaskCounts(counts);
  } catch (error) {
    console.error('Fehler beim Laden der Tasks:', error);
  }
}

function renderTaskCounts(counts) {
  document.getElementById('countToDo').textContent = counts.to_do;
  document.getElementById('countInProgress').textContent = counts.in_progress;
  document.getElementById('countAwaitFeedback').textContent = counts.await_feedback;
  document.getElementById('countDone').textContent = counts.done;
  document.getElementById('countTotal').textContent = counts.total;
}

window.addEventListener('load', loadTasksAndCount);