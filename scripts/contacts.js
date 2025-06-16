let contacts = [];
let activeContactIndex = null;

/** Render contacts */
async function renderContacts() {
  let contactsObj = await fetchContacts();

  contacts = Object.entries(contactsObj).filter(([key]) => key.startsWith("contact")).map(([, value]) => value);

  contacts.sort((a, b) => a.name.localeCompare(b.name));

  let html = generateContactListHTML(contacts);
  document.getElementById("contacts").innerHTML = html;
}

/** Generates the HTML and the seperator */
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

/** Toggles contact details */
function toggleContactDetails(index) {
  if (activeContactIndex === index) {
    clearContactDetails();
    removeContactHighlights();
    activeContactIndex = null;
    return;
  }

  let contact = contacts[index];
  let color = circleColors[index % circleColors.length];

  renderContactDetails(contact, color);
  removeContactHighlights();
  highlightSelectedContact(index);
  activeContactIndex = index;
}

/** Displays contact details */
function renderContactDetails(contact, color) {
  document.getElementById("contactSelected").innerHTML = contactDetailsHTML(
    contact,
    color
  );
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

/** Removes the selected contact in the list */
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
  document.getElementById("contactAdd").classList.remove("open");
}

/** Saves an new contact */
async function saveNewContact(event) {
  event.preventDefault();
  let form = event.target.closest("form");
  if (!form.checkValidity()) return form.reportValidity();

  let newContact = getContactInformation();
  await loadContactIntoAPI(newContact);
  await renderContacts();

  let newIndex = contacts.findIndex(c => c.name === newContact.name);

  closeOverlay();
  if (newIndex !== -1) toggleContactDetails(newIndex);

  showSuccessMessage();
  form.reset();
}

/** Gets entered contact */
function getContactInformation() {
  let name = document.getElementById("addContactName").value;
  let email = document.getElementById("addContactMail").value;
  let phonenumber = document.getElementById("addContactPhone").value;

  return { name, email, phonenumber };
}

/** Loads contact into the API */
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

/** Displayes a message, when the submission of a contact was successful */
function showSuccessMessage() {
  let successDiv = document.getElementById('contactSuccessfull');
  successDiv.classList.add('active');

  setTimeout(() => {
    successDiv.classList.remove('active');
  }, 2000);
}








function contactsHTML(contact, index, color) {
  return `
    <div id="contact${index}" class="contactEntry" onclick="toggleContactDetails(${index})">
      <span class="circle circleGap" style="background-color: ${color};">${getInitials(
    contact.name
  )}</span>
      <div class="contactEntryAlignment">
        <div class="contactEntryName">${contact.name}</div>
        <div class="contactEntryMail">${contact.email}</div>
      </div>
    </div>
  `;
}

function seperatorHTML(currentLetter) {
  return `
    <div class="contactsLetterSeparator">${currentLetter}</div>
    <div class="contactsLetterSeparatorLine"></div>
  `;
}

function contactDetailsHTML(contact, color) {
  return `
    <div class="contactSelectedMain">
      <span class="circle circleDetails" style="background-color: ${color};">${getInitials(
    contact.name
  )}</span>
      <div class="contactsSelectedNameIcons">
        <span>${contact.name}</span>
        <div class="contactSelectedIcons">
          <div class="contactSelectedIcon">
            <img src="../assets/icons/edit.svg" alt="edit">
            <span>Edit</span>
          </div>
          <div class="contactSelectedIcon">
            <img src="../assets/icons/delete.svg" alt="delete">
            <span>Delete</span>
          </div>
        </div>
      </div>
    </div>
    <div class="contactSelectedInformation">Contact Information</div>
    <div class="contactSelectedInfos">
      <div class="contactSelectedInfosAlignment">
        <span class="bold">Email</span> 
        <span class="contactEntryMail">${contact.email}</span>
      </div>
      <div class="contactSelectedInfosAlignment">
        <span class="bold">Phone</span> 
        <span>${contact.phonenumber}</span>
      </div>
    </div>
  `;
}
