/** Global click event handler for dropdown menus. Detects clicks outside dropdowns and handles label clicks. for specific dropdown configurations. 
 * @param {MouseEvent} event - The triggered click event. */
window.onclick = event => {
  const dropdowns = [
    { inputId: "addTaskContacts", wrapperId: "contacts", labelFor: "addTaskContacts" },
    { inputId: "addTaskCategory", wrapperId: "category", labelFor: "addTaskCategory" }
  ];

  dropdowns.forEach(dd => {
    if (!dd.inputId || !dd.wrapperId) return;
    handleDropdownClickOutside(dd, event);
    if (dd.wrapperId === "contacts" && event.target.closest(`label[for="${dd.labelFor}"]`))
      handleDropdownClickOnLabel(dd);
  });
};

/** Closes the contacts details in mobile view if the width of the page is more than 1400px */
window.addEventListener("resize", () => {
  let contactsList = document.querySelector(".contactsList");

  if (window.innerWidth >= 1400 && contactsList) {
    contactsList.style.display = "block";
  }
});

/** The function ensures that the selected contact’s details remain visible when resizing the window to a smaller width.*/
window.addEventListener("resize", () => {
  let contactsList = document.querySelector(".contactsList");

  if (!contactsList) return;
  if (activeContactIndex === null || activeContactIndex === undefined) return;

  if (window.innerWidth >= 1400) {
    contactsList.style.display = "block";
  } else {
    contactsList.style.display = "none";
  }
});

/** Toggles the mobile edit/delete menu visibility. */
window.toggleMobileMenu = () => {
  const menu = document.getElementById("mobileEditDelete");
  const btn = document.getElementById("moreMobile");
  if (!menu || !btn) return;

  menu.classList.toggle("show");
  if (menu.classList.contains("show")) {
    setTimeout(() => document.addEventListener("click", outsideClick), 0);
  } else {
    document.removeEventListener("click", outsideClick);
  }
};

/** Listen for window resize events to adapt the Add Task overlay behavior. */
window.addEventListener("resize", handleResizeAddTaskOverlay);
