let contacts = [];
let activeContactIndex = null;

/** Render contacts */
async function renderContacts() {
  let contactsObj = await fetchContacts();
  contacts = Object.values(contactsObj);

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
  document.getElementById("contactSelected").innerHTML = contactDetailsHTML(contact, color);
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
