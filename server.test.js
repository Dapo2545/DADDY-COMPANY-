const request = require('supertest');
const nodemailer = require('nodemailer');

jest.mock('nodemailer');
jest.mock('dotenv', () => ({ config: jest.fn() }));
jest.mock('express-rate-limit', () => jest.fn(() => (req, res, next) => next()));

const mockSendMail = jest.fn();
nodemailer.createTransport.mockReturnValue({ sendMail: mockSendMail });

// Set env vars before requiring server so the transporter is configured
process.env.EMAIL_USER = 'test@gmail.com';
process.env.EMAIL_PASS = 'testpass';
process.env.NOTIFY_EMAIL = 'notify@gmail.com';

const app = require('./server');

afterEach(() => {
    mockSendMail.mockReset();
});

describe('POST /api/contact', () => {
    const validPayload = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+2341234567890',
        service: 'Technical Operations',
        message: 'I need help with my project.',
    };

    describe('input validation', () => {
        it('returns 400 when name is missing', async () => {
            const { name, ...payload } = validPayload;
            const res = await request(app)
                .post('/api/contact')
                .send(payload);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Name, Email, and Message fields are required.');
            expect(mockSendMail).not.toHaveBeenCalled();
        });

        it('returns 400 when email is missing', async () => {
            const { email, ...payload } = validPayload;
            const res = await request(app)
                .post('/api/contact')
                .send(payload);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Name, Email, and Message fields are required.');
            expect(mockSendMail).not.toHaveBeenCalled();
        });

        it('returns 400 when message is missing', async () => {
            const { message, ...payload } = validPayload;
            const res = await request(app)
                .post('/api/contact')
                .send(payload);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Name, Email, and Message fields are required.');
            expect(mockSendMail).not.toHaveBeenCalled();
        });

        it('returns 400 when body is empty', async () => {
            const res = await request(app)
                .post('/api/contact')
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Name, Email, and Message fields are required.');
        });

        it('returns 400 when all required fields are empty strings', async () => {
            const res = await request(app)
                .post('/api/contact')
                .send({ name: '', email: '', message: '' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Name, Email, and Message fields are required.');
        });

        it('returns 400 for invalid email format', async () => {
            const res = await request(app)
                .post('/api/contact')
                .send({ ...validPayload, email: 'not-an-email' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Please provide a valid email address.');
            expect(mockSendMail).not.toHaveBeenCalled();
        });
    });

    describe('successful submission', () => {
        beforeEach(() => {
            mockSendMail.mockImplementation((options, callback) => {
                callback(null);
            });
        });

        it('returns 200 and sends email with all fields', async () => {
            const res = await request(app)
                .post('/api/contact')
                .send(validPayload);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Inquiry successfully sent!');
            expect(mockSendMail).toHaveBeenCalledTimes(1);

            const mailOptions = mockSendMail.mock.calls[0][0];
            expect(mailOptions.subject).toContain('John Doe');
            expect(mailOptions.html).toContain('John Doe');
            expect(mailOptions.html).toContain('john@example.com');
            expect(mailOptions.html).toContain('+2341234567890');
            expect(mailOptions.html).toContain('Technical Operations');
            expect(mailOptions.html).toContain('I need help with my project.');
        });

        it('returns 200 with only required fields (no phone or service)', async () => {
            const res = await request(app)
                .post('/api/contact')
                .send({ name: 'Jane', email: 'jane@test.com', message: 'Hello' });

            expect(res.status).toBe(200);
            expect(mockSendMail).toHaveBeenCalledTimes(1);

            const mailOptions = mockSendMail.mock.calls[0][0];
            expect(mailOptions.html).toContain('Not Provided');
            expect(mailOptions.html).toContain('General Inquiry');
        });
    });

    describe('email dispatch failure', () => {
        it('returns 500 when sendMail fails', async () => {
            mockSendMail.mockImplementation((options, callback) => {
                callback(new Error('SMTP connection refused'));
            });

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const res = await request(app)
                .post('/api/contact')
                .send(validPayload);

            expect(res.status).toBe(500);
            expect(res.body.error).toBe('Failed to deliver message. Please try again later.');
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });
    });

    describe('email content structure', () => {
        beforeEach(() => {
            mockSendMail.mockImplementation((options, callback) => {
                callback(null);
            });
        });

        it('includes proper subject line with client name', async () => {
            await request(app)
                .post('/api/contact')
                .send(validPayload);

            const mailOptions = mockSendMail.mock.calls[0][0];
            expect(mailOptions.subject).toBe('New Business Inquiry from John Doe');
        });

        it('uses env-var based from and to addresses', async () => {
            await request(app)
                .post('/api/contact')
                .send(validPayload);

            const mailOptions = mockSendMail.mock.calls[0][0];
            expect(mailOptions.from).toBe('test@gmail.com');
            expect(mailOptions.to).toBe('notify@gmail.com');
        });

        it('renders HTML email body with expected sections', async () => {
            await request(app)
                .post('/api/contact')
                .send(validPayload);

            const mailOptions = mockSendMail.mock.calls[0][0];
            expect(mailOptions.html).toContain('<div');
            expect(mailOptions.html).toContain('New Service Inquiry');
            expect(mailOptions.html).toContain('Client Name:');
            expect(mailOptions.html).toContain('Client Email:');
            expect(mailOptions.html).toContain('Phone Number:');
            expect(mailOptions.html).toContain('Service Requested:');
        });

        it('escapes HTML in user input to prevent injection', async () => {
            await request(app)
                .post('/api/contact')
                .send({
                    name: '<script>alert("xss")</script>',
                    email: 'test@example.com',
                    message: 'Hello <b>world</b>',
                });

            const mailOptions = mockSendMail.mock.calls[0][0];
            expect(mailOptions.html).not.toContain('<script>');
            expect(mailOptions.html).toContain('&lt;script&gt;');
            expect(mailOptions.html).toContain('&lt;b&gt;world&lt;/b&gt;');
        });
    });
});

describe('GET * (fallback route)', () => {
    it('serves the index.html file', async () => {
        const res = await request(app).get('/');

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/html/);
        expect(res.text).toContain('Premium Professional Services');
    });

    it('serves index.html for unknown routes', async () => {
        const res = await request(app).get('/nonexistent-page');

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/html/);
    });
});

describe('middleware', () => {
    it('parses JSON request bodies', async () => {
        mockSendMail.mockImplementation((options, callback) => {
            callback(null);
        });

        const res = await request(app)
            .post('/api/contact')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify({
                name: 'Test',
                email: 'test@test.com',
                message: 'Testing JSON parsing',
            }));

        expect(res.status).toBe(200);
    });

    it('includes security headers from helmet', async () => {
        const res = await request(app).get('/');

        expect(res.headers['x-content-type-options']).toBe('nosniff');
    });
});

describe('nodemailer transporter', () => {
    it('was configured with gmail service and env-var credentials', () => {
        expect(nodemailer.createTransport).toHaveBeenCalledWith(
            expect.objectContaining({
                service: 'gmail',
                auth: expect.objectContaining({
                    user: 'test@gmail.com',
                    pass: 'testpass',
                }),
            })
        );
    });
});

describe('helper functions', () => {
    const escapeHtml = (() => {
        return function (str) {
            if (typeof str !== 'string') return '';
            return str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        };
    })();

    const isValidEmail = (() => {
        return function (email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        };
    })();

    describe('escapeHtml', () => {
        it('escapes all HTML special characters', () => {
            expect(escapeHtml('<div class="test">&\'end\'')).toBe(
                '&lt;div class=&quot;test&quot;&gt;&amp;&#039;end&#039;'
            );
        });

        it('returns empty string for non-string input', () => {
            expect(escapeHtml(undefined)).toBe('');
            expect(escapeHtml(null)).toBe('');
            expect(escapeHtml(123)).toBe('');
        });

        it('returns the same string when no special characters', () => {
            expect(escapeHtml('hello world')).toBe('hello world');
        });
    });

    describe('isValidEmail', () => {
        it('accepts valid email addresses', () => {
            expect(isValidEmail('user@example.com')).toBe(true);
            expect(isValidEmail('a@b.c')).toBe(true);
        });

        it('rejects invalid email addresses', () => {
            expect(isValidEmail('not-an-email')).toBe(false);
            expect(isValidEmail('@no-user.com')).toBe(false);
            expect(isValidEmail('no-domain@')).toBe(false);
            expect(isValidEmail('has spaces@example.com')).toBe(false);
        });
    });
});
