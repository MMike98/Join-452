const BASE_URL = "https://join-gruppenarbeit-a540b-default-rtdb.europe-west1.firebasedatabase.app";

/** Fetches a user from Firebase by email */
async function getUserByEmail(email) {
  const url = `${BASE_URL}/users.json?orderBy=%22email%22&equalTo=%22${email}%22`;
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

function toggleDropdown() {
  document.getElementById("myDropdown").style.display = "block";
}

window.addEventListener("mouseup", function (event) {
  let menu = document.getElementById("myDropdown");
  if (event.target != menu && event.target.parentNode != menu) {
    menu.style.display = "none";
  }
});







async function loadContactsIntoCheckboxDropdown() {
    const url = `${BASE_URL}/contacts.json`;
    const response = await fetch(url);
    const contacts = await response.json();

    const dropdown = document.getElementById('addTaskContact');
    dropdown.innerHTML = ''; // Zurücksetzen

    for (const key in contacts) {
      const contact = contacts[key];
      if (contact.name) {
        const label = document.createElement('label');
        label.innerHTML = `
          <input type="checkbox" value="${contact.name}"> ${contact.name}
        `;
        dropdown.appendChild(label);
      }
    }
  }

  function toggleCheckboxDropdown() {
    const dropdown = document.getElementById('addTaskContact');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
  }

  // Dropdown schließen, wenn außerhalb geklickt
  window.addEventListener('click', function (e) {
    const dropdown = document.getElementById('addTaskContact');
    const selectBox = document.querySelector('.addTaskSelectBox'); // Korrektur hier
    
    // Wenn der Klick außerhalb des Dropdowns UND des Auswahlfeldes erfolgt: Dropdown schließen
    if (!selectBox.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });

  // Beim Laden der Seite: Kontakte laden
  document.addEventListener('DOMContentLoaded', loadContactsIntoCheckboxDropdown);
