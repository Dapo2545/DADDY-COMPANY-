/**
 * Shared validation utilities.
 * Reusable validators for request payloads across all API routes.
 */

/**
 * Validates that all specified fields are present and non-empty in the payload.
 * @param {Object} payload - The request body to validate.
 * @param {string[]} requiredFields - Array of field names that must be present.
 * @returns {{ valid: boolean, missing: string[] }}
 */
function validateRequiredFields(payload, requiredFields) {
    const missing = requiredFields.filter(
        (field) => !payload[field] || String(payload[field]).trim() === ''
    );
    return {
        valid: missing.length === 0,
        missing,
    };
}

/**
 * Validates an email address format.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Sanitizes a string to prevent basic XSS in HTML email templates.
 * @param {string} str
 * @returns {string}
 */
function sanitizeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

module.exports = {
    validateRequiredFields,
    isValidEmail,
    sanitizeHtml,
};
