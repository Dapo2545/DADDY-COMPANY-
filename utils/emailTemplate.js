/**
 * Shared email template builder.
 * Extracts the duplicated inline HTML email generation into a reusable utility.
 */
const { sanitizeHtml } = require('./validation');

/**
 * Generates a styled HTML email for a new business inquiry.
 * @param {{ name: string, email: string, phone?: string, service?: string, message: string }} data
 * @returns {string} HTML email body
 */
function buildInquiryEmail(data) {
    const name = sanitizeHtml(data.name);
    const email = sanitizeHtml(data.email);
    const phone = sanitizeHtml(data.phone) || 'Not Provided';
    const service = sanitizeHtml(data.service) || 'General Inquiry';
    const message = sanitizeHtml(data.message);

    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px;">New Service Inquiry</h2>
            ${buildField('Client Name', name)}
            ${buildField('Client Email', email)}
            ${buildField('Phone Number', phone)}
            ${buildField('Service Requested', service)}
            <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #3b82f6; margin-top: 15px;">
                <p style="margin: 0; font-style: italic;">"${message}"</p>
            </div>
        </div>
    `;
}

/**
 * Builds a single labeled field row for the email template.
 * Eliminates the repeated <p><strong>Label:</strong> value</p> pattern.
 * @param {string} label
 * @param {string} value
 * @returns {string}
 */
function buildField(label, value) {
    return `<p><strong>${label}:</strong> ${value}</p>`;
}

/**
 * Constructs the full mail options object for nodemailer.
 * @param {{ senderAddress: string, recipientAddress: string }} emailConfig
 * @param {{ name: string, email: string, phone?: string, service?: string, message: string }} data
 * @returns {Object} nodemailer mail options
 */
function buildMailOptions(emailConfig, data) {
    return {
        from: emailConfig.senderAddress,
        to: emailConfig.recipientAddress,
        subject: `🚨 New Business Inquiry from ${sanitizeHtml(data.name)}`,
        html: buildInquiryEmail(data),
    };
}

module.exports = {
    buildInquiryEmail,
    buildMailOptions,
    buildField,
};
