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

/** Closes the contact add/edit overlays and resets the form. */
function closeOverlay() {
  let addOverlay = document.getElementById("contactAdd");
  let editOverlay = document.getElementById("contactEdit");

  if (addOverlay) {
    addOverlay.classList.remove("open");
    resetContactForm("contactAdd");
  }

  if (editOverlay) {
    editOverlay.classList.remove("open");
    resetContactForm("contactEdit");
  }
}

/** Resets all input fields and error messages inside the given form. */
function resetContactForm(overlayId) {
  let form = document.querySelector(`#${overlayId} form`);
  if (!form) return;

  form.reset();

  form.querySelectorAll("input").forEach(input => {
    input.classList.remove("inputError");
  });

  form.querySelectorAll(".errorText").forEach(error => {
    error.classList.add("d_none");
  });
}

/** Handles the submit event to save a new contact. */
async function saveNewContact(event) {
  event.preventDefault();
  clearAllErrors();

  let nameInput = document.getElementById("addContactName");
  let mailInput = document.getElementById("addContactMail");
  let phoneInput = document.getElementById("addContactPhone");

  let isValid = validateForm(nameInput, mailInput, phoneInput);
  if (!isValid) return;

  let newContact = extractContactData(nameInput, mailInput, phoneInput);
  await loadContactIntoAPI(newContact);
  await renderContacts();

  handlePostSave(newContact);
  clearFormFields(nameInput, mailInput, phoneInput);
}

/** Validates the contact form inputs. */
function validateForm(nameInput, mailInput, phoneInput) {
  let validName = validateField(nameInput, ".errorTextNameAlignment");
  let validMail = validateEmailField(mailInput, ".errorTextMailAlignment");
  let validPhone = validatePhoneField(phoneInput, ".errorTextPhoneAlignment");
  return validName && validMail && validPhone;
}

/** Validates the edit form inputs for name, email, and phone. */
function validateEditForm(nameInput, mailInput, phoneInput) {
  let validName = validateNameField(nameInput);
  let validMail = validateEmailFieldEdit(mailInput);
  let validPhone = validatePhoneFieldEdit(phoneInput);
  return validName && validMail && validPhone;
}

/** Validates the name input field. */
function validateNameField(input) {
  let errorDiv = input.nextElementSibling;
  let isValid = input.value.trim() !== "";
  input.classList.toggle("inputError", !isValid);
  errorDiv.classList.toggle("d_none", isValid);
  return isValid;
}

/** Validates the email input field in edit mode. Checks if the input is not empty and matches the email pattern. Toggles error messages and input error styles accordingly. */
function validateEmailFieldEdit(input) {
  let errorEmpty = input.nextElementSibling;
  let errorInvalid = errorEmpty.nextElementSibling;
  
  errorEmpty.classList.add("d_none");
  errorInvalid.classList.add("d_none");
  input.classList.remove("inputError");

  let email = input.value.trim();
  if (email === "") {
    errorEmpty.classList.remove("d_none");
    input.classList.add("inputError");
    return false;
  }
  let emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    errorInvalid.classList.remove("d_none");
    input.classList.add("inputError");
    return false;
  }
  return true;
}

/** Validates the phone number input field in edit mode. */
function validatePhoneFieldEdit(input) {
  let errorEmpty = input.nextElementSibling;
  let errorInvalid = errorEmpty.nextElementSibling;

  errorEmpty.classList.add("d_none");
  errorInvalid.classList.add("d_none");
  input.classList.remove("inputError");

  let phone = input.value.trim();

  if (phone === "") {
    errorEmpty.classList.remove("d_none");
    input.classList.add("inputError");
    return false;
  }

  let phoneRegex = /^\+[1-9][0-9]{1,3}[1-9][0-9]{4,}$/;
  if (!phoneRegex.test(phone)) {
    errorInvalid.classList.remove("d_none");
    input.classList.add("inputError");
    return false;
  }

  return true;
}

/** Validates the email input field for presence and correct format. */
function validateEmailField(input, errorSelector) {
  let email = input.value.trim();
  let errorDivs = document.querySelectorAll(errorSelector);
  let emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

  errorDivs.forEach(div => div.classList.add("d_none"));
  input.classList.remove("inputError");

  if (!email) {
    errorDivs[0].classList.remove("d_none");
    input.classList.add("inputError");
    return false;
  }

  if (!emailRegex.test(email)) {
    errorDivs[1].classList.remove("d_none");
    input.classList.add("inputError");
    return false;
  }

  return true;
}

/** Validates the phone input field for presence and international format. */
function validatePhoneField(input, errorSelector) {
  let phone = input.value.trim();
  let errorDivs = document.querySelectorAll(errorSelector);
  let phoneRegex = /^\+[1-9][0-9]{1,3}[1-9][0-9]{4,}$/;

  errorDivs.forEach(div => div.classList.add("d_none"));
  input.classList.remove("inputError");

  if (!phone) {
    errorDivs[0].classList.remove("d_none");
    input.classList.add("inputError");
    return false;
  }

  if (!phoneRegex.test(phone)) {
    errorDivs[1].classList.remove("d_none");
    input.classList.add("inputError");
    return false;
  }

  return true;
}

/** Validates a single input field and toggles error styles. */
function validateField(input, errorSelector) {
  let errorDiv = document.querySelector(errorSelector);
  let isValid = input.value.trim() !== "";
  input.classList.toggle("inputError", !isValid);
  errorDiv.classList.toggle("d_none", isValid);
  return isValid;
}

/** Validates a generic input field by checking if it's not empty. */
function validateEditField(input, errorSelector) {
  let errorDiv = document.querySelector(errorSelector);
  let isValid = input.value.trim() !== "";
  input.classList.toggle("inputError", !isValid);
  errorDiv.classList.toggle("d_none", isValid);
  return isValid;
}

/** Extracts contact data from the form inputs. */
function extractContactData(nameInput, mailInput, phoneInput) {
  return {
    name: nameInput.value.trim(),
    email: mailInput.value.trim(),
    phonenumber: phoneInput.value.trim(),
  };
}

/** Clears form field values and removes input error classes. */
function clearFormFields(...inputs) {
  inputs.forEach(input => {
    input.value = "";
    input.classList.remove("inputError");
  });
}

/** Hides all error messages and removes error borders from inputs. */
function clearAllErrors() {
  let errorTexts = document.querySelectorAll(".errorText");
  let errorInputs = document.querySelectorAll(".inputError");

  errorTexts.forEach(div => div.classList.add("d_none"));
  errorInputs.forEach(input => input.classList.remove("inputError"));
}

/** Handles UI updates after successfully saving a new contact. */
function handlePostSave(newContact) {
  let newIndex = contacts.findIndex(c => c.name === newContact.name);
  closeOverlay();
  if (newIndex !== -1) toggleContactDetails(newIndex);
  showSuccessMessage();
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
  const nameInput = document.getElementById("editContactName");
  const mailInput = document.getElementById("editContactMail");
  const phoneInput = document.getElementById("editContactPhone");

  // Hier Validierung ergänzen (siehe Beispiel unten)
  if (!validateEditForm(nameInput, mailInput, phoneInput)) {
    return; // Abbruch, wenn ungültig
  }

  contacts[editContactIndex].name = nameInput.value;
  contacts[editContactIndex].email = mailInput.value;
  contacts[editContactIndex].phonenumber = phoneInput.value;

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
