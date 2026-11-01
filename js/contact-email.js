/* Deterrence for simple address scrapers, not access control. No external service. */
(() => {
 document.querySelectorAll('[data-contact-email]').forEach(button => {
  button.disabled = false;
  button.addEventListener('click', () => {
   window.location.href = 'mailto:' + atob('c29yZW5mcm9zdHN0YWFsQGdtYWlsLmNvbQ==');
  });
 });
})();