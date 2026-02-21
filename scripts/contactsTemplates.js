/** Generates the HTML for a single contact entry in the contacts list.
 * @param {Object} contact - The contact object containing name and email.
 * @param {number} index - The index of the contact in the list.
 * @param {string} color - The background color for the contact's circle.
 * @returns {string} HTML string representing a contact entry.
 */
function contactsHTML(contact, index, color) {
  return `
    <div id="contact${index}" class="contactEntry" onclick="toggleContactDetails(${index})">
      <span class="circle circleGap" style="background-color: ${color};">${getInitials(contact.name)}</span>
      <div class="contactEntryAlignment">
        <div class="contactEntryName">${contact.name}</div>
        <div class="contactEntryMail">${contact.email}</div>
      </div>
    </div>
  `;
}

/** Generates the HTML for a letter separator in the contacts list.
 * @param {string} currentLetter - The letter to display as the separator.
 * @returns {string} HTML string representing a letter separator. */
function seperatorHTML(currentLetter) {
  return `
    <div class="contactsLetterSeparator">${currentLetter}</div>
    <div class="contactsLetterSeparatorLine"></div>
  `;
}

/** Generates the HTML for the detailed view of a selected contact.
 * @param {Object} contact - The contact object containing name, email, and phonenumber.
 * @param {string} color - The background color for the contact's circle.
 * @param {number} index - The index of the contact in the list.
 * @returns {string} HTML string representing the contact details view. */
function contactDetailsHTML(contact, color, index) {
  return `
    <div class="contactSelectedMain">
      <span class="circle circleDetails" style="background-color: ${color};">${getInitials(contact.name)}</span>
      <div class="contactsSelectedNameIcons">
        <span>${contact.name}</span>
        <div class="contactSelectedIcons">
          <div class="contactSelectedIcon" id="edit" onclick="editContact(${index})">Edit</div>
          <div class="contactSelectedIcon" id="delete" onclick="deleteContact(${index})">Delete</div>
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