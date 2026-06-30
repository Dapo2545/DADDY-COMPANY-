require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// ---------------------------------------------------------------------------
// Security middleware
// ---------------------------------------------------------------------------

// HTTP security headers (XSS protection, clickjacking prevention, etc.)
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                imgSrc: ["'self'", "data:"],
                connectSrc: ["'self'"],
            },
        },
    })
);

// CORS – restrict to known origins instead of allowing every domain
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [`http://localhost:${PORT}`];

app.use(
    cors({
        origin(origin, callback) {
            // Allow requests with no origin (server-to-server, curl, etc.)
            if (!origin || ALLOWED_ORIGINS.includes(origin)) {
                return callback(null, true);
            }
            callback(new Error('Not allowed by CORS'));
        },
        methods: ['GET', 'POST'],
    })
);

// Body parser with a size limit to prevent payload abuse
app.use(express.json({ limit: '16kb' }));

// Rate-limit the contact endpoint to prevent spam
const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per window per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' },
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// ---------------------------------------------------------------------------
// Email configuration – credentials come from environment variables
// ---------------------------------------------------------------------------

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL;

if (!EMAIL_USER || !EMAIL_PASS || !NOTIFY_EMAIL) {
    console.warn(
        'WARNING: EMAIL_USER, EMAIL_PASS, or NOTIFY_EMAIL is not set. ' +
        'The contact form will not be able to send emails.'
    );
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
    },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Escape HTML special characters to prevent HTML injection in emails.
 */
function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Basic email-format validation.
 */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------------------------------------------------------------------------
// API route – contact form
// ---------------------------------------------------------------------------

app.post('/api/contact', contactLimiter, (req, res) => {
    const { name, email, phone, service, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, Email, and Message fields are required.' });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (!EMAIL_USER || !EMAIL_PASS || !NOTIFY_EMAIL) {
        return res.status(503).json({ error: 'Email service is not configured.' });
    }

    // Sanitize every user-supplied value before embedding in HTML
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone);
    const safeService = escapeHtml(service);
    const safeMessage = escapeHtml(message);

    const mailOptions = {
        from: EMAIL_USER,
        to: NOTIFY_EMAIL,
        subject: `New Business Inquiry from ${safeName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px;">New Service Inquiry</h2>
                <p><strong>Client Name:</strong> ${safeName}</p>
                <p><strong>Client Email:</strong> ${safeEmail}</p>
                <p><strong>Phone Number:</strong> ${safePhone || 'Not Provided'}</p>
                <p><strong>Service Requested:</strong> ${safeService || 'General Inquiry'}</p>
                <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #3b82f6; margin-top: 15px;">
                    <p style="margin: 0; font-style: italic;">"${safeMessage}"</p>
                </div>
            </div>
        `,
    };

    transporter.sendMail(mailOptions, (error) => {
        if (error) {
            console.error('Email dispatch failure:', error);
            return res.status(500).json({ error: 'Failed to deliver message. Please try again later.' });
        }
        res.status(200).json({ message: 'Inquiry successfully sent!' });
    });
});

// Fallback to serve frontend
app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
}

module.exports = app;
