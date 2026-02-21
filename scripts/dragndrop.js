let currentDraggedElement;
let draggedCard = null;
let placeholder = null;
let offsetY = 0;
let touchStartY = 0;
let touchStartX = 0;
let hasMoved = false;

/** Starts dragging a task by setting the dragged element's ID.
 * @param {string} id - The ID of the task being dragged. */
function startDragging(id) {
  currentDraggedElement = id;
}

/** Allows the drop event by preventing the default behavior.
 * @param {Event} ev - The event object triggered by the drop action. */
function allowDrop(ev) {
  ev.preventDefault();
}

/** Handles the drop event when a task is moved to a new status.
 * @param {Event} ev - The event object triggered by the drop action.
 * @param {string} newStatus - The new status to move the task to (e.g., 'in_progress'). */
function drop(ev, newStatus) {
  ev.preventDefault();

  const card = document.getElementById(`card-${currentDraggedElement}`);
  if (!card) return;

  const key = card.dataset.key;
  moveTo(newStatus, key);
}

/** Moves a task to a new status and updates it in Firebase and the UI.
 * @param {string} status - The new status to set for the task (e.g., 'to_do', 'done').
 * @param {string} key - The unique key of the task to be moved. */
async function moveTo(status, key) {
  task[key].status = status;

  try { await updateFirebase(key, status); } 
  catch (e) { console.error("Firebase error:", e); }

  updateHTML();
  animateCardWiggle(key);
}

/** Animates the task card with a "wiggle" effect.
 * @param {string} key - The unique key of the task to animate. */
function animateCardWiggle(key) {
  const card = document.getElementById(`card-${key}`);
  if (!card) return;

  card.classList.add("wiggle");
  card.addEventListener("animationend", () => card.classList.remove("wiggle"), { once: true });
}

/** Initializes the touch start event for dragging a card on touch devices.
 * @param {TouchEvent} e - The touchstart event triggered by the user. */
document.addEventListener("touchstart", (e) => {
  const card = e.target.closest(".card");
  if (!card) return;

  draggedCard = card;
  const { top, left, width, height } = card.getBoundingClientRect();
  touchStartY = e.touches[0].clientY;
  touchStartX = e.touches[0].clientX;

  placeholder = document.createElement("div");
  placeholder.classList.add("card-placeholder");
  placeholder.style.cssText = `width:${width}px;height:${height}px`;
  card.parentElement.insertBefore(placeholder, card);

  document.body.classList.add("no-scroll");
});

/** Handles the touch move event for dragging a task card on touch devices.
 * @param {TouchEvent} e - The touchmove event triggered as the user drags. */
document.addEventListener("touchmove", (e) => {
  if (!draggedCard) return;

  const touch = e.touches[0];
  if (!hasMoved && Math.abs(touch.clientY - touchStartY) > 10 || Math.abs(touch.clientX - touchStartX) > 10) {
    initiateDrag(touch);
  }

  if (!hasMoved) return;

  if (e.cancelable) e.preventDefault();
  updateCardPosition(touch);
  handleDropTarget(touch);
}, { passive: false });

/** Initiates the drag process by setting card styles. */
function initiateDrag(touch) {
  hasMoved = true;
  const { width, left, top } = draggedCard.getBoundingClientRect();
  draggedCard.classList.add("dragging");
  draggedCard.style.cssText = `
    position: absolute;
    z-index: 999;
    pointer-events: none;
    width: ${width}px;
    left: ${left}px;
    top: ${top}px;
  `;
  offsetY = touch.clientY - draggedCard.getBoundingClientRect().top;
}

/** Updates the position of the dragged card. */
function updateCardPosition(touch) {
  draggedCard.style.top = `${touch.clientY - offsetY}px`;
  draggedCard.style.left = `${placeholder.getBoundingClientRect().left}px`;
}

/** Handles the drop target behavior. */
function handleDropTarget(touch) {
  const lists = Array.from(document.querySelectorAll(".card-list"));
  lists.forEach((list) => {
    const listRect = list.getBoundingClientRect();
    if (touch.clientY > listRect.top && touch.clientY < listRect.bottom) {
      list.classList.add("drop-target");
      updatePlaceholderPosition(list, touch);
    } else {
      list.classList.remove("drop-target");
    }
  });
}

/** Updates the placeholder's position within the list. */
function updatePlaceholderPosition(list, touch) {
  const cards = Array.from(list.querySelectorAll(".card:not(.dragging)"));
  let inserted = false;
  for (const card of cards) {
    const cardRect = card.getBoundingClientRect();
    if (touch.clientY < cardRect.top + cardRect.height / 2) {
      list.insertBefore(placeholder, card);
      inserted = true;
      break;
    }
  }
  if (!inserted) list.appendChild(placeholder);
}

/** Handles the touch end event when the user releases a dragged task card.
 * @param {TouchEvent} e - The touchend event triggered when the user stops dragging. */
document.addEventListener("touchend", async (e) => {
  if (!draggedCard) return;

  if (!hasMoved) {
    resetDrag();
    return;
  }

  await finalizeDrop();

  resetCardStyles();
  removeDropTargetClasses();

  resetDrag();
});

/** Resets the dragged card and removes the placeholder and scroll lock. */
function resetDrag() {
  draggedCard = null;
  if (placeholder) placeholder.remove();
  placeholder = null;
  document.body.classList.remove("no-scroll");
}

/** Finalizes the drop by moving the task and updating its status. */
async function finalizeDrop() {
  placeholder.parentElement.insertBefore(draggedCard, placeholder);

  const newStatus = placeholder.parentElement.id;
  const key = draggedCard.dataset.key;

  await moveTo(newStatus, key);
}

/** Resets the card's styles after the drag operation. */
function resetCardStyles() {
  draggedCard.classList.remove("dragging");
  draggedCard.style.position = "";
  draggedCard.style.zIndex = "";
  draggedCard.style.pointerEvents = "";
  draggedCard.style.left = "";
  draggedCard.style.top = "";
  draggedCard.style.width = "";
}

/** Removes the drop target classes from the card lists. */
function removeDropTargetClasses() {
  document.querySelectorAll(".card-list.drop-target").forEach((list) => {
    list.classList.remove("drop-target");
  });
}

/** Adds visual feedback for drag-and-drop on task columns. */
function setupDropzoneHighlight() {
  const columnIds = ["to_do", "in_progress", "await_feedback", "done"];
  const counters = new WeakMap();

  columnIds.forEach(id => {
    const col = document.getElementById(id);
    if (!col) return;
    counters.set(col, 0);

    const enter = () => { counters.set(col, (counters.get(col) || 0) + 1); col.classList.add("drop-target"); };
    const leave = () => { let n = (counters.get(col) || 1) - 1; counters.set(col, n <= 0 ? 0 : n); if (n <= 0) col.classList.remove("drop-target"); };
    const drop = () => { col.classList.remove("drop-target"); counters.set(col, 0); };

    col.addEventListener("dragenter", enter);
    col.addEventListener("dragleave", leave);
    col.addEventListener("drop", drop);
  });
}