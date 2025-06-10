/** Render contacts */
async function renderContacts() {
  let contactsObj = await fetchContacts();
  let contacts = Object.values(contactsObj);

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



function contactsHTML(contact, index, color) {
  return `
    <div id="contact${index}" class="contactEntry">
      <span class="circle circleGap" style="background-color: ${color};">${getInitials(contact.name)}</span>
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


