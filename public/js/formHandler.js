/**
 * Contact form handler.
 * Extracted from the inline <script> in index.html to improve
 * modularity and eliminate mixing of concerns.
 */

/**
 * Resolves the API base URL based on the current environment.
 * @returns {string}
 */
function getApiBaseUrl() {
    const origin = window.location.origin;
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return 'http://localhost:5000';
    }
    return origin;
}

/**
 * Gathers all form field values into a payload object.
 * Eliminates repeated document.getElementById calls scattered across the handler.
 * @returns {{ name: string, email: string, phone: string, service: string, message: string }}
 */
function getFormPayload() {
    return {
        name: document.getElementById('clientName').value,
        email: document.getElementById('clientEmail').value,
        phone: document.getElementById('clientPhone').value,
        service: document.getElementById('clientService').value,
        message: document.getElementById('clientMessage').value,
    };
}

/**
 * Sets the submit button to a loading or ready state.
 * @param {HTMLButtonElement} btn
 * @param {boolean} isLoading
 */
function setButtonState(btn, isLoading) {
    btn.innerText = isLoading
        ? 'Transmitting Lead Dispatches...'
        : 'Submit Business Briefing & Dispatches';
    btn.disabled = isLoading;
}

/**
 * Submits the contact form payload to the backend API.
 * @param {Object} payload
 * @returns {Promise<{ ok: boolean, data: Object }>}
 */
async function submitContactForm(payload) {
    const response = await fetch(`${getApiBaseUrl()}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await response.json();
    return { ok: response.ok, data };
}

/**
 * Initializes the contact form event listener.
 * Call this once on DOMContentLoaded.
 */
function initContactForm() {
    const form = document.getElementById('corporateContactForm');
    const submitBtn = document.getElementById('submitBtn');

    if (!form || !submitBtn) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        setButtonState(submitBtn, true);

        try {
            const payload = getFormPayload();
            const result = await submitContactForm(payload);

            if (result.ok) {
                alert('Message sent successfully! Your dad will see it in his email inbox.');
                form.reset();
            } else {
                alert(`Submission Failed: ${result.data.error}`);
            }
        } catch (err) {
            alert('Communication breakdown with backend server execution engine.');
        } finally {
            setButtonState(submitBtn, false);
        }
    });
}
