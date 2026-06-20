const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// --- NODEMAILER EMAIL CONFIGURATION ---
// IMPORTANT: To make this work securely, use service environment variables or an App Password.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'YOUR_SYSTEM_EMAIL@gmail.com', // The email address sending the alerts
        pass: 'YOUR_GMAIL_APP_PASSWORD'      // Your 16-character Gmail App Password
    }
});

// --- API ROUTE FOR THE CONTACT FORM ---
app.post('/api/contact', (req, res) => {
    const { name, email, phone, service, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, Email, and Message fields are required.' });
    }

    // Design the layout of the email notification your dad will receive
    const mailOptions = {
        from: 'YOUR_SYSTEM_EMAIL@gmail.com',
        to: 'YOUR_DADDY_EMAIL@gmail.com', // Put your dad's real email address here!
        subject: `🚨 New Business Inquiry from ${name}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px;">New Service Inquiry</h2>
                <p><strong>Client Name:</strong> ${name}</p>
                <p><strong>Client Email:</strong> ${email}</p>
                <p><strong>Phone Number:</strong> ${phone || 'Not Provided'}</p>
                <p><strong>Service Requested:</strong> ${service || 'General Inquiry'}</p>
                <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #3b82f6; margin-top: 15px;">
                    <p style="margin: 0; font-style: italic;">"${message}"</p>
                </div>
            </div>
        `
    };

    // Dispatch the email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Email dispatch pipeline failure:', error);
            return res.status(500).json({ error: 'Failed to deliver message to email system.' });
        }
        console.log('Business alert message successfully dispatched:', info.response);
        res.status(200).json({ message: 'Inquiry successfully sent directly to our service desk!' });
    });
});

// Fallback to serve frontend architecture
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Corporate backend active and monitoring requests on port: ${PORT}`);
});