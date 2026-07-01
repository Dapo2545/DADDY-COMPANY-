---
name: testing-webapp
description: Test the DADDY-COMPANY- webapp end-to-end. Use when verifying frontend rendering, form submission, or backend API changes.
---

# Testing the DADDY-COMPANY- Webapp

## Quick Start

```bash
cd /path/to/DADDY-COMPANY-
npm install
node server.js
# Server runs at http://localhost:5000
```

## Architecture

- **Frontend**: Single-page app served as static files from root + `public/` directory
- **Backend**: Express 5 API with a single POST endpoint `/api/contact`
- **JS Modules**: `public/js/services.js` (card data + renderer), `public/js/formHandler.js` (form submission), `public/js/app.js` (init)
- **Shared Utils**: `config/index.js`, `utils/validation.js`, `utils/emailTemplate.js`
- **Security**: helmet, CORS origin validation, rate limiting (10 req/15min on /api/contact)

## What to Test

### Frontend Rendering
- Service cards are rendered dynamically by `public/js/services.js` — if the module fails, `#servicesGrid` will be empty (0 cards)
- The service dropdown (`#clientService`) starts with NO static `<option>` elements — they are injected by `populateServiceDropdown()` from the same SERVICES array
- Key assertion: card titles must match dropdown options (single source of truth)

### Form Submission Flow
1. Form handler attaches via `initContactForm()` in `public/js/app.js`
2. On submit, button text changes to "Transmitting Lead Dispatches..."
3. Payload POSTed to `/api/contact`
4. On success: alert + form reset. On error: alert with error message, form data preserved.

### Backend Validation (testable via curl)
```bash
# Missing required fields
curl -s -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"","email":"","message":""}'
# Expected: {"error":"The following fields are required: name, email, message."}

# Invalid email format
curl -s -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"bad-email","message":"hi"}'
# Expected: {"error":"Please provide a valid email address."}
```

## Known Constraints

- **Email sending requires credentials**: Set `EMAIL_USER`, `EMAIL_PASS`, `NOTIFY_EMAIL` env vars (or `.env` file). Without them, server logs a warning at startup and returns a graceful error on submission.
- **Rate limiting**: The `/api/contact` endpoint is rate-limited to 10 requests per 15 minutes per IP. If testing repeatedly, you may hit the limit.
- **Express 5 wildcard routes**: Use `{*path}` syntax, NOT `*` (Express 5 breaking change).
- **CORS**: By default only allows requests from `http://localhost:5000`. For curl testing, requests without an Origin header are allowed.

## Devin Secrets Needed

- `EMAIL_USER` — Gmail address for sending (only needed to test actual email delivery)
- `EMAIL_PASS` — Gmail App Password (only needed to test actual email delivery)
- `NOTIFY_EMAIL` — Recipient email address (only needed to test actual email delivery)

Note: These are NOT needed for testing rendering, validation, or form UX — only for end-to-end email delivery testing.
