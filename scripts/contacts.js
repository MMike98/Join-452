let contacts = [];
let activeContactIndex = null;
let contactKeys = [];
let editContactIndex = null;

/** Renders contacts in the list on the left side and sorts them alphabetically*/
async function renderContacts() {
  let contactsObj = await fetchContacts();

  let entries = Object.entries(contactsObj).filter(([key]) =>
    key.startsWith("contact")
  );
  entries.sort(([, a], [, b]) => a.name.localeCompare(b.name));

  contactKeys = entries.map(([key]) => key);
  contacts = entries.map(([, value]) => value);

  let html = generateContactListHTML(contacts);
  document.getElementById("contacts").innerHTML = html;
}

/** Generates the HTML and the seperator in order to display all information in the list on the left side */
function generateContactListHTML(contacts) {
  let html = "";
  let currentLetter = "";

  contacts.forEach((contact, index) => {
    let firstLetter = contact.name.trim()[0].toUpperCase();

    if (firstLetter !== currentLetter) {
      currentLetter = firstLetter;
      html += seperatorHTML(currentLetter);
    }

    let color = circleColors[index % circleColors.length];
    html += contactsHTML(contact, index, color);
  });

  return html;
}

/** Toggles contact details: If a contact is clicked, the details are shown on the right side. If it is clicked again, the information vanishes. In the mobile view the lsit is removed and the contact details are displayed on the screen
 */
function toggleContactDetails(index, forceOpen = false) {
  let container = document.getElementById("contactSelected");
  let contactsList = document.querySelector(".contactsList");
  let contactDetails = document.getElementById("contactDetails");

  let isDesktop = window.innerWidth >= 1400;

  if (isDesktop) {
    if (
      handleDesktopToggle(index, forceOpen, container, contactsList, contactDetails)
    )
      return;
  } else {
    handleMobileView(contactsList, contactDetails);
  }

  let contact = contacts[index];
  let color = circleColors[index % circleColors.length];

  container.innerHTML = contactDetailsHTML(contact, color, index);
  container.classList.add("slide-in");

  removeContactHighlights();
  highlightSelectedContact(index);
  activeContactIndex = index;
}

/** Desktop view */
function handleDesktopToggle(index, forceOpen, container, contactsList,) {
  if (!forceOpen && activeContactIndex === index) {
    container.classList.remove("slide-in");
    removeContactHighlights();
    activeContactIndex = null;
    return true;
  }
  if (contactsList) contactsList.style.display = "block";
  return false;
}

/** Mobile view */
function handleMobileView(contactsList, contactDetails) {
  if (contactsList) contactsList.style.display = "none";
}

/** Displays contact details */
function renderContactDetails(contact, color, index) {
  let container = document.getElementById("contactSelected");

  container.classList.remove("slide-in");
  container.innerHTML = contactDetailsHTML(contact, color, index);
  container.classList.add("slide-in");
}

/** Removes contact details */
function clearContactDetails() {
  document.getElementById("contactSelected").innerHTML = "";
}

/** Marks the selected contact in the list */
function highlightSelectedContact(index) {
  let entry = document.getElementById(`contact${index}`);
  if (entry) {
    entry.classList.add("contactEntrySelected");
  }
}

/** Removes the highlighting from the selected contact in the list. */
function removeContactHighlights() {
  let allEntries = document.getElementsByClassName("contactEntry");
  for (let entry of allEntries) {
    entry.classList.remove("contactEntrySelected");
  }
}

/** Adds a new contact */
function addNewContact() {
  document.getElementById("contactAdd").classList.add("open");
}

/** Close overay */
function closeOverlay() {
  let addOverlay = document.getElementById("contactAdd");
  let editOverlay = document.getElementById("contactEdit");

  if (addOverlay) addOverlay.classList.remove("open");
  if (editOverlay) editOverlay.classList.remove("open");
}

/** Saves an new contact */
async function saveNewContact(event) {
  event.preventDefault();
  let form = event.target.closest("form");
  if (!form.checkValidity()) return form.reportValidity();

  let newContact = getContactInformation();
  await loadContactIntoAPI(newContact);
  await renderContacts();

  let newIndex = contacts.findIndex((c) => c.name === newContact.name);

  closeOverlay();
  if (newIndex !== -1) toggleContactDetails(newIndex);

  showSuccessMessage();
  form.reset();
}

/** Gets entered information of a new contact */
function getContactInformation() {
  let name = document.getElementById("addContactName").value;
  let email = document.getElementById("addContactMail").value;
  let phonenumber = document.getElementById("addContactPhone").value;

  return { name, email, phonenumber };
}

/** Loads new contact into the API */
async function loadContactIntoAPI(newContact) {
  let lastIdRes = await fetch(`${BASE_URL}/contacts/lastContactId.json`);
  let lastId = parseInt(await lastIdRes.json()) || 0;

  let nextId = lastId + 1;
  let newContactKey = `contact${nextId}`;

  await fetch(`${BASE_URL}/contacts/${newContactKey}.json`, {
    method: "PUT",
    body: JSON.stringify(newContact),
  });

  await fetch(`${BASE_URL}/contacts/lastContactId.json`, {
    method: "PUT",
    body: JSON.stringify(nextId),
  });
}

/** Displayes a message, when the submission of a new contact was successful */
function showSuccessMessage() {
  let successDiv = document.getElementById("contactSuccessfull");
  successDiv.classList.add("active");

  setTimeout(() => {
    successDiv.classList.remove("active");
  }, 2000);
}

/** Deletes contact trom API */
async function deleteContact(index) {
  let keyToDelete = contactKeys[index];
  await fetch(`${BASE_URL}/contacts/${keyToDelete}.json`, {
    method: "DELETE",
  });

  await renderContacts();

  clearContactDetails();
  removeContactHighlights();
  activeContactIndex = null;
  closeOverlay();
}

/** Edits an existing contact*/
function editContact(index, color) {
  editContactIndex = index;
  document.getElementById("contactEdit").classList.add("open");

  let contact = contacts[index];
  color = color || circleColors[index % circleColors.length];

  if (contact) {
    document.getElementById("editContactName").value = contact.name;
    document.getElementById("editContactMail").value = contact.email;
    document.getElementById("editContactPhone").value = contact.phonenumber;
  }
  renderEditAvatar(contact, color);
}

/** Renders the avatar of the selected contact in the edit overlay */
function renderEditAvatar(contact, color) {
  let avatarContainer = document.getElementById("editContactAvatar");

  avatarContainer.innerHTML = `<span class="circle circleDetails circlePosition" style="background-color: ${color};">${getInitials(contact.name)}</span>`;
}

/** Saves the edited contact in the API*/
async function saveEditedContact(editContactIndex) {
  contacts[editContactIndex].name = document.getElementById("editContactName").value;
  contacts[editContactIndex].email = document.getElementById("editContactMail").value;
  contacts[editContactIndex].phonenumber = document.getElementById("editContactPhone").value;

  let contactKey = contactKeys[editContactIndex];

  await fetch(`${BASE_URL}/contacts/${contactKey}.json`, {
    method: "PUT",
    body: JSON.stringify(contacts[editContactIndex]),
  });

  renderContacts();
  toggleContactDetails(editContactIndex, true);
  closeOverlay();
}

/** Closes the contact details in mobile view */
function closeContactDetailsMobile() {
  let container = document.getElementById("contactSelected");
  let contactsList = document.querySelector(".contactsList");

  if (container) container.classList.remove("slide-in");
  if (contactsList) contactsList.style.display = "block";
  removeContactHighlights();
  activeContactIndex = null;
}

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

/** Toggles the visibility of the mobile edit/delete menu. */
window.toggleMobileMenu = function () {
  let menu = document.getElementById("mobileEditDelete");
  let moreButton = document.getElementById("moreMobile");
  if (!menu || !moreButton) return;

  let isVisible = menu.classList.contains("show");

  if (isVisible) {
    menu.classList.remove("show");
    document.removeEventListener("click", outsideClick);
  } else {
    menu.classList.add("show");
    setTimeout(() => {
      document.addEventListener("click", outsideClick);
    }, 0);
  }
};

/**  Handles clicks outside the mobile edit/delete menu and the toggle button. If the click is outside, the menu is hidden and the event listener is removed. */
function outsideClick(event) {
  let menu = document.getElementById("mobileEditDelete");
  let moreButton = document.getElementById("moreMobile");
  if (!menu || !moreButton) return;

  if (
    menu.classList.contains("show") &&
    !menu.contains(event.target) &&
    !moreButton.contains(event.target)
  ) {
    menu.classList.remove("show");
    document.removeEventListener("click", outsideClick);
  }
}
