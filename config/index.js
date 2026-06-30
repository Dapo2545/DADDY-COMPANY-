/**
 * Centralized application configuration.
 * Eliminates hardcoded values scattered across server.js.
 */
const config = {
    port: process.env.PORT || 5000,

    email: {
        service: process.env.EMAIL_SERVICE || 'gmail',
        senderAddress: process.env.EMAIL_USER || '',
        senderPassword: process.env.EMAIL_PASS || '',
        recipientAddress: process.env.NOTIFY_EMAIL || '',
    },

    cors: {
        allowedOrigins: process.env.ALLOWED_ORIGINS || '',
    },
};

module.exports = config;
