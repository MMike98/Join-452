// SCRIPT FOR NAVIGATION BAR AND HEADER //*css*/`
/**
 * @param {MouseEvent} event - Das Klick-Ereignis, ausgelöst durch den User.
 */
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

/**
 * 
 */
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

window.addEventListener('DOMContentLoaded', handleDOMContentLoaded);