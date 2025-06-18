let contacts = [];
let activeContactIndex = null;
let contactKeys = [];
let editContactIndex = null;

/** Renders contacts in the list on the left side and sorts them alphabetically*/
async function renderContacts() {
  let contactsObj = await fetchContacts();

  let entries = Object.entries(contactsObj).filter(([key]) => key.startsWith("contact"));
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

/** Toggles contact details: If a contact is clicked, the details are shown on the right side. If it is clicked again, the information vanishes. */
function toggleContactDetails(index, forceOpen = false) {
  if (!forceOpen && activeContactIndex === index) {
    clearContactDetails();
    removeContactHighlights();
    activeContactIndex = null;
    return;
  }

  let contact = contacts[index];
  let color = circleColors[index % circleColors.length];

  renderContactDetails(contact, color, index);
  removeContactHighlights();
  highlightSelectedContact(index);
  activeContactIndex = index;
}

/** Displays contact details */
function renderContactDetails(contact, color, index) {
  document.getElementById("contactSelected").innerHTML = contactDetailsHTML(contact, color, index);
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

