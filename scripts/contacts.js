let contacts = [];
let activeContactIndex = null;
let contactKeys = [];
let editContactIndex = null;

/** Fetches contacts from the API, sorts them alphabetically, updates global arrays `contacts` and `contactKeys`, and renders the contact list in the DOM.
 * @async
 * @returns {Promise<void>} Resolves when the contacts are rendered. */
async function renderContacts() {
  const data = await fetchContacts();
  const entries = Object.entries(data).filter(([k]) => k.startsWith("contact")).sort(([,a],[,b]) => a.name.localeCompare(b.name));

  contactKeys = entries.map(([k]) => k);
  contacts = entries.map(([,v]) => v);

  document.getElementById("contacts").innerHTML = generateContactListHTML(contacts);
}

/** Generates the full HTML for the contact list with letter separators.
 * @param {Array<Object>} contacts - Array of contact objects.
 * @returns {string} HTML string for the entire contact list. */
function generateContactListHTML(contacts) {
  let html = "", currentLetter = "";

  contacts.forEach((c, i) => {
    const firstLetter = isNaN(c.name.trim()[0]) ? c.name.trim()[0].toUpperCase() : "1–9";
    if (firstLetter !== currentLetter) { currentLetter = firstLetter; html += seperatorHTML(currentLetter); }
    html += contactsHTML(c, i, circleColors[i % circleColors.length]);
  });

  return html;
}

/** Toggles the display of contact details for a given contact.
 * @param {number} index - Index of the contact in the contacts array.
 * @param {boolean} [forceOpen=false] - Force open the details even if already open. */
function toggleContactDetails(index, forceOpen = false) {
  const container = document.getElementById("contactSelected"),
        contactsList = document.querySelector(".contactsList"),
        contactDetails = document.getElementById("contactDetails"),
        isDesktop = window.innerWidth >= 1400;

  if (isDesktop && handleDesktopToggle(index, forceOpen, container, contactsList, contactDetails)) return;
  if (!isDesktop) handleMobileView(contactsList, contactDetails);

  const contact = contacts[index],
        color = circleColors[index % circleColors.length];

  container.innerHTML = contactDetailsHTML(contact, color, index);
  container.classList.add("slide-in");

  removeContactHighlights();
  highlightSelectedContact(index);
  activeContactIndex = index;
}

/** Handles toggling of contact details in desktop view. Hides details if the same contact is clicked again.
 * @param {number} index - Index of the clicked contact.
 * @param {boolean} forceOpen - Force the details to stay open.
 * @param {HTMLElement} container - The container for contact details.
 * @param {HTMLElement} contactsList - The contact list element.
 * @returns {boolean} True if details were closed, otherwise false. */
function handleDesktopToggle(index, forceOpen, container, contactsList) {
  if (!forceOpen && activeContactIndex === index) {
    container.classList.remove("slide-in");
    removeContactHighlights();
    activeContactIndex = null;
    return true;
  }
  if (contactsList) contactsList.style.display = "block";
  return false;
}

/** Handles hiding the contact list in mobile view.
 * @param {HTMLElement} contactsList - The contact list element.
 * @param {HTMLElement} contactDetails - The contact details container. */
function handleMobileView(contactsList, contactDetails) {
  if (contactsList) contactsList.style.display = "none";
}

/** Renders the details of a selected contact into the container.
 * @param {Object} contact - The contact object.
 * @param {string} color - The color for the contact circle.
 * @param {number} index - The index of the contact. */
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

/** Highlights the selected contact in the contact list.
 * @param {number} index - The index of the contact to highlight. */
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

/** Resets all input fields and hides error messages in a form.
 * @param {string} overlayId - The ID of the overlay containing the form. */
function resetContactForm(overlayId) {
  const form = document.querySelector(`#${overlayId} form`);
  if (!form) return;

  form.reset();
  form.querySelectorAll("input").forEach(i => i.classList.remove("inputError"));
  form.querySelectorAll(".errorText").forEach(e => e.classList.add("d_none"));
}

/** Handles submit to save a new contact.
 * @param {Event} event - The form submit event. */
async function saveNewContact(event) {
  event.preventDefault();
  clearAllErrors();

  const name = document.getElementById("addContactName"),
        mail = document.getElementById("addContactMail"),
        phone = document.getElementById("addContactPhone");

  if (!validateForm(name, mail, phone)) return;

  const newContact = extractContactData(name, mail, phone);
  await loadContactIntoAPI(newContact);
  await renderContacts();

  handlePostSave(newContact);
  clearFormFields(name, mail, phone);
}

/** Validates the contact form inputs: name, email, and phone.
 * @param {HTMLInputElement} nameInput - The name input field.
 * @param {HTMLInputElement} mailInput - The email input field.
 * @param {HTMLInputElement} phoneInput - The phone input field.
 * @returns {boolean} True if all inputs are valid. */
function validateForm(nameInput, mailInput, phoneInput) {
  let validName = validateField(nameInput, ".errorTextNameAlignment");
  let validMail = validateEmailField(mailInput, ".errorTextMailAlignment");
  let validPhone = validatePhoneField(phoneInput, ".errorTextPhoneAlignment");
  return validName && validMail && validPhone;
}

/** Validates the edit form inputs for name, email, and phone.
 * @param {HTMLInputElement} nameInput - The name input field.
 * @param {HTMLInputElement} mailInput - The email input field.
 * @param {HTMLInputElement} phoneInput - The phone input field.
 * @returns {boolean} True if all inputs are valid. */
function validateEditForm(nameInput, mailInput, phoneInput) {
  let validName = validateNameField(nameInput);
  let validMail = validateEmailFieldEdit(mailInput);
  let validPhone = validatePhoneFieldEdit(phoneInput);
  return validName && validMail && validPhone;
}

/** Validates the name input field.
 * @param {HTMLInputElement} input - The name input field.
 * @returns {boolean} True if the input is not empty. */
function validateNameField(input) {
  let errorDiv = input.nextElementSibling;
  let isValid = input.value.trim() !== "";
  input.classList.toggle("inputError", !isValid);
  errorDiv.classList.toggle("d_none", isValid);
  return isValid;
}

/** Validates an email input field and shows error messages.
 * @param {HTMLInputElement} input - The email input element.
 * @returns {boolean} True if valid, false otherwise. */
function validateEmailFieldEdit(input) {
  const [errorEmpty, errorInvalid] = [input.nextElementSibling, input.nextElementSibling.nextElementSibling];
  [errorEmpty, errorInvalid].forEach(e => e.classList.add("d_none"));
  input.classList.remove("inputError");

  const email = input.value.trim();
  if (!email) return errorEmpty.classList.remove("d_none"), input.classList.add("inputError"), false;
  if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email)) return errorInvalid.classList.remove("d_none"), input.classList.add("inputError"), false;
  return true;
}

/** Validates a phone number input field and shows error messages.
 * @param {HTMLInputElement} input - The phone input element.
 * @returns {boolean} True if valid, false otherwise. */
function validatePhoneFieldEdit(input) {
  const [errorEmpty, errorInvalid] = [input.nextElementSibling, input.nextElementSibling.nextElementSibling];
  [errorEmpty, errorInvalid].forEach(e => e.classList.add("d_none"));
  input.classList.remove("inputError");

  const phone = input.value.trim();
  if (!phone) return errorEmpty.classList.remove("d_none"), input.classList.add("inputError"), false;
  if (!/^\+[1-9][0-9]{1,3}[1-9][0-9]{4,}$/.test(phone)) return errorInvalid.classList.remove("d_none"), input.classList.add("inputError"), false;
  return true;
}

/** Validates an email input field and shows error messages.
 * @param {HTMLInputElement} input - The email input element.
 * @param {string} errorSelector - CSS selector for the error divs.
 * @returns {boolean} True if valid, false otherwise. */
function validateEmailField(input, errorSelector) {
  const email = input.value.trim(), [errEmpty, errInvalid] = document.querySelectorAll(errorSelector);
  [errEmpty, errInvalid].forEach(e => e.classList.add("d_none"));
  input.classList.remove("inputError");
  if (!email) return errEmpty.classList.remove("d_none"), input.classList.add("inputError"), false;
  if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email)) return errInvalid.classList.remove("d_none"), input.classList.add("inputError"), false;
  return true;
}

/** Validates a phone input field for presence and international format.
 * @param {HTMLInputElement} input - The phone input element.
 * @param {string} errorSelector - CSS selector for the error divs.
 * @returns {boolean} True if valid, false otherwise. */
function validatePhoneField(input, errorSelector) {
  const phone = input.value.trim(), [errEmpty, errInvalid] = document.querySelectorAll(errorSelector);
  [errEmpty, errInvalid].forEach(e => e.classList.add("d_none"));
  input.classList.remove("inputError");
  if (!phone) return errEmpty.classList.remove("d_none"), input.classList.add("inputError"), false;
  if (!/^\+[1-9][0-9]{1,3}[1-9][0-9]{4,}$/.test(phone)) return errInvalid.classList.remove("d_none"), input.classList.add("inputError"), false;
  return true;
}

/** Validates a single input field and toggles error styles.
 * @param {HTMLInputElement} input - The input field to validate.
 * @param {string} errorSelector - CSS selector of the error message element.
 * @returns {boolean} True if the input is not empty. */
function validateField(input, errorSelector) {
  let errorDiv = document.querySelector(errorSelector);
  let isValid = input.value.trim() !== "";
  input.classList.toggle("inputError", !isValid);
  errorDiv.classList.toggle("d_none", isValid);
  return isValid;
}

/** Validates a generic input field in edit mode by checking if it's not empty.
 * @param {HTMLInputElement} input - The input field to validate.
 * @param {string} errorSelector - CSS selector of the error message element.
 * @returns {boolean} True if the input is not empty. */
function validateEditField(input, errorSelector) {
  let errorDiv = document.querySelector(errorSelector);
  let isValid = input.value.trim() !== "";
  input.classList.toggle("inputError", !isValid);
  errorDiv.classList.toggle("d_none", isValid);
  return isValid;
}

/** Extracts contact data from form inputs.
 * @param {HTMLInputElement} nameInput - The name input field.
 * @param {HTMLInputElement} mailInput - The email input field.
 * @param {HTMLInputElement} phoneInput - The phone input field.
 * @returns {Object} An object with `name`, `email`, and `phonenumber` properties. */
function extractContactData(nameInput, mailInput, phoneInput) {
  return {
    name: nameInput.value.trim(),
    email: mailInput.value.trim(),
    phonenumber: phoneInput.value.trim(),
  };
}

/** Clears form field values and removes input error classes.
 * @param {...HTMLInputElement} inputs - One or more input fields to reset. */
function clearFormFields(...inputs) {
  inputs.forEach((input) => {
    input.value = "";
    input.classList.remove("inputError");
  });
}

/** Hides all error messages and removes error borders from inputs. */
function clearAllErrors() {
  let errorTexts = document.querySelectorAll(".errorText");
  let errorInputs = document.querySelectorAll(".inputError");

  errorTexts.forEach((div) => div.classList.add("d_none"));
  errorInputs.forEach((input) => input.classList.remove("inputError"));
}

/** Handles UI updates after successfully saving a new contact. Closes overlay, shows the contact details, and displays a success message.
 * @param {Object} newContact - The contact object that was just saved.
 * @param {string} newContact.name - Name of the contact.
 * @param {string} newContact.email - Email of the contact.
 * @param {string} newContact.phonenumber - Phone number of the contact. */
function handlePostSave(newContact) {
  let newIndex = contacts.findIndex((c) => c.name === newContact.name);
  closeOverlay();
  if (newIndex !== -1) toggleContactDetails(newIndex);
  showSuccessMessage();
}

/** Retrieves entered information from the "Add Contact" form.
 * @returns {Object} An object containing `name`, `email`, and `phonenumber` of the contact. */
function getContactInformation() {
  let name = document.getElementById("addContactName").value;
  let email = document.getElementById("addContactMail").value;
  let phonenumber = document.getElementById("addContactPhone").value;

  return { name, email, phonenumber };
}

/** Saves a new contact to the API and updates the last contact ID.
 * @param {Object} newContact - Contact data to be saved. */
async function loadContactIntoAPI(newContact) {
  let lastId = parseInt(await (await fetch(`${BASE_URL}/contacts/lastContactId.json`)).json()) || 0;
  let nextId = lastId + 1, key = `contact${nextId}`;

  await fetch(`${BASE_URL}/contacts/${key}.json`, { method: "PUT", body: JSON.stringify(newContact) });
  await fetch(`${BASE_URL}/contacts/lastContactId.json`, { method: "PUT", body: JSON.stringify(nextId) });
}

/** Displayes a message, when the submission of a new contact was successful */
function showSuccessMessage() {
  let successDiv = document.getElementById("contactSuccessfull");
  successDiv.classList.add("active");

  setTimeout(() => {successDiv.classList.remove("active");}, 2000);
}

/** Deletes a contact from the API and updates the UI.
 * @param {number} index - The index of the contact to delete.
 * @returns {Promise<void>}
 */
async function deleteContact(index) {
  await fetch(`${BASE_URL}/contacts/${contactKeys[index]}.json`, { method: "DELETE" });
  await renderContacts();
  clearContactDetails();
  removeContactHighlights();
  activeContactIndex = null;
  closeOverlay();
}

/** Opens the edit overlay for a contact and fills in its current data.
 * @param {number} index - The index of the contact to edit in the contacts array.
 * @param {string} [color] - Optional color for the avatar circle. Defaults to a color from `circleColors`. */
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

/** Renders the avatar circle for a contact in the edit overlay.
 * @param {Object} contact - The contact object containing at least a `name` property.
 * @param {string} color - The background color for the avatar circle. */
function renderEditAvatar(contact, color) {
  let avatarContainer = document.getElementById("editContactAvatar");

  avatarContainer.innerHTML = `<span class="circle circleDetails circlePosition" style="background-color: ${color};">${getInitials(contact.name)}</span>`;
}

/** Saves the edited contact to the API and updates the UI.
 * @param {number} editContactIndex - Index of the contact being edited.
 */
async function saveEditedContact(editContactIndex) {
  const name = document.getElementById("editContactName"),
        email = document.getElementById("editContactMail"),
        phone = document.getElementById("editContactPhone");

  if (!validateEditForm(name, email, phone)) return;

  Object.assign(contacts[editContactIndex], { name: name.value, email: email.value, phonenumber: phone.value });

  await fetch(`${BASE_URL}/contacts/${contactKeys[editContactIndex]}.json`, { method: "PUT", body: JSON.stringify(contacts[editContactIndex]) });

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

/** Handles clicks outside the mobile edit/delete menu and the toggle button. If a click occurs outside both, the menu is hidden and the event listener is removed.
 * @param {MouseEvent} event - The click event triggered by the user. */
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
