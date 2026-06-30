/**
 * Application entry point.
 * Initializes all frontend modules on page load.
 */
document.addEventListener('DOMContentLoaded', () => {
    renderAllServices('servicesGrid');
    populateServiceDropdown('clientService');
    initContactForm();
});
