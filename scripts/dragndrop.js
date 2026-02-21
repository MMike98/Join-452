let currentDraggedElement;
let draggedCard = null;
let placeholder = null;
let offsetY = 0;
let touchStartY = 0;
let touchStartX = 0;
let hasMoved = false;

/** Starts dragging a task. */
function startDragging(id) {
  currentDraggedElement = id;
}

/** Allows drop by preventing default event. */
function allowDrop(ev) {
  ev.preventDefault();
}

/** Handles drop event to move task to new status. */
function drop(ev, newStatus) {
  ev.preventDefault();

  const card = document.getElementById(`card-${currentDraggedElement}`);
  if (!card) return;

  const key = card.dataset.key;
  moveTo(newStatus, key);
}

/** Moves a task to a new status and updates Firebase + UI */
async function moveTo(status, key) {
  task[key].status = status;

  try { await updateFirebase(key, status); } 
  catch (e) { console.error("Firebase error:", e); }

  updateHTML();
  animateCardWiggle(key);
}

/** Animates the card with a wiggle effect */
function animateCardWiggle(key) {
  const card = document.getElementById(`card-${key}`);
  if (!card) return;

  card.classList.add("wiggle");
  card.addEventListener("animationend", () => card.classList.remove("wiggle"), { once: true });
}

document.addEventListener("touchstart", (e) => {
  const card = e.target.closest(".card");
  if (!card) return;

  draggedCard = card;

  const rect = card.getBoundingClientRect();
  touchStartY = e.touches[0].clientY;
  touchStartX = e.touches[0].clientX;
  hasMoved = false;

  placeholder = document.createElement("div");
  placeholder.classList.add("card-placeholder");
  placeholder.style.width = `${card.offsetWidth}px`;
  placeholder.style.height = `${card.offsetHeight}px`;
  card.parentElement.insertBefore(placeholder, card);

  document.body.classList.add("no-scroll");
});

document.addEventListener(
  "touchmove",
  (e) => {
    if (!draggedCard) return;

    const touch = e.touches[0];
    const deltaY = Math.abs(touch.clientY - touchStartY);
    const deltaX = Math.abs(touch.clientX - touchStartX);

    if (!hasMoved && (deltaY > 10 || deltaX > 10)) {
      hasMoved = true;

      const rect = draggedCard.getBoundingClientRect();
      draggedCard.classList.add("dragging");
      draggedCard.style.position = "absolute";
      draggedCard.style.zIndex = 999;
      draggedCard.style.pointerEvents = "none";
      draggedCard.style.width = `${rect.width}px`;
      draggedCard.style.left = `${rect.left}px`;
      draggedCard.style.top = `${rect.top}px`;

      offsetY = touch.clientY - rect.top;
    }

    if (!hasMoved) return;

    if (e.cancelable) e.preventDefault();

    draggedCard.style.top = `${touch.clientY - offsetY}px`;
    draggedCard.style.left = `${placeholder.getBoundingClientRect().left}px`;

    const lists = Array.from(document.querySelectorAll(".card-list"));
    lists.forEach((list) => {
      const listRect = list.getBoundingClientRect();
      if (touch.clientY > listRect.top && touch.clientY < listRect.bottom) {
        list.classList.add("drop-target");

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
      } else {
        list.classList.remove("drop-target");
      }
    });
  },
  { passive: false },
);

document.addEventListener("touchend", async (e) => {
  if (!draggedCard) return;

  if (!hasMoved) {
    draggedCard = null;
    placeholder.remove();
    placeholder = null;
    document.body.classList.remove("no-scroll");
    return;
  }

  placeholder.parentElement.insertBefore(draggedCard, placeholder);

  const newStatus = placeholder.parentElement.id;
  const key = draggedCard.dataset.key;

  await moveTo(newStatus, key);

  draggedCard.classList.remove("dragging");
  draggedCard.style.position = "";
  draggedCard.style.zIndex = "";
  draggedCard.style.pointerEvents = "";
  draggedCard.style.left = "";
  draggedCard.style.top = "";
  draggedCard.style.width = "";

  document.querySelectorAll(".card-list.drop-target").forEach((list) => {
    list.classList.remove("drop-target");
  });

  placeholder.remove();
  placeholder = null;
  draggedCard = null;
  hasMoved = false;

  document.body.classList.remove("no-scroll");
});
