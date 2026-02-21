/** Handles clicking on a navigation button by setting it as active and removing the active class from others.
 * @param {MouseEvent} event - The click event triggered by the user. */
function buttonActive(event) {
  event.preventDefault();
  const navLinks = document.querySelectorAll(".nav-bar-button");

  for (let i = 0; i < navLinks.length; i++) {
    navLinks[i].classList.remove("active");
  }

  event.target.classList.add("active");
}

const navLinks = document.querySelectorAll(".nav-bar-button");
for (let i = 0; i < navLinks.length; i++) {
  navLinks[i].addEventListener("click", buttonActive);
}

/** Highlights the navigation button that corresponds to the current page on page load. */
function handleDOMContentLoaded() {
  const navLinks = document.querySelectorAll('.nav-bar-button');
  const currentPage = window.location.pathname.split('/').pop();

  for (let i = 0; i < navLinks.length; i++) {
    const href = navLinks[i].getAttribute('href');
    const hrefPage = href.split('/').pop();

    if (currentPage === hrefPage) {
      navLinks[i].classList.add('active');
    }
  }
}

/** Register the function to run on DOM content loaded */
window.addEventListener('DOMContentLoaded', handleDOMContentLoaded);