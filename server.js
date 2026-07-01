require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const config = require('./config');
const { validateRequiredFields, isValidEmail } = require('./utils/validation');
const { buildMailOptions } = require('./utils/emailTemplate');

const app = express();

// ---------------------------------------------------------------------------
// Security middleware
// ---------------------------------------------------------------------------

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
    : [`http://localhost:${config.port}`];

app.use(
    cors({
        origin(origin, callback) {
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
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname)));

// ---------------------------------------------------------------------------
// Email configuration – credentials from shared config (env vars via dotenv)
// ---------------------------------------------------------------------------

if (!config.email.senderAddress || !config.email.senderPassword || !config.email.recipientAddress) {
    console.warn(
        'WARNING: EMAIL_USER, EMAIL_PASS, or NOTIFY_EMAIL is not set. ' +
        'The contact form will not be able to send emails.'
    );
}

const transporter = nodemailer.createTransport({
    service: config.email.service,
    auth: {
        user: config.email.senderAddress,
        pass: config.email.senderPassword,
    },
});

// ---------------------------------------------------------------------------
// API route – contact form
// ---------------------------------------------------------------------------

app.post('/api/contact', contactLimiter, (req, res) => {
    const { name, email, phone, service, message } = req.body;

    // Validation via shared utility
    const { valid, missing } = validateRequiredFields(req.body, ['name', 'email', 'message']);
    if (!valid) {
        return res.status(400).json({
            error: `The following fields are required: ${missing.join(', ')}.`,
        });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (!config.email.senderAddress || !config.email.senderPassword || !config.email.recipientAddress) {
        return res.status(503).json({ error: 'Email service is not configured.' });
    }

    // Build mail options via shared template utility (sanitization handled inside)
    const mailOptions = buildMailOptions(config.email, { name, email, phone, service, message });

    transporter.sendMail(mailOptions, (error) => {
        if (error) {
            console.error('Email dispatch failure:', error);
            return res.status(500).json({ error: 'Failed to deliver message. Please try again later.' });
        }
        res.status(200).json({ message: 'Inquiry successfully sent!' });
    });
});

// Fallback to serve frontend
app.get('{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
});
