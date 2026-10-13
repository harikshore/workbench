# Module 8: Email

## Choices

| Decision | Choice |
|----------|--------|
| Email service | Resend |
| Free tier | 100 emails/day, 3,000/month |
| Use case | Transactional emails (OTPs, notifications, receipts) |

## Why Resend

- Generous free tier for MVPs
- Simple API — one function call to send
- Supports React email templates (build emails in JSX)
- Great deliverability out of the box

## How it's set up

### Graceful fallback

The auth config checks for `RESEND_API_KEY`:
- **Key present** → sends real emails via Resend
- **Key empty** → logs OTPs to the console (for development without email setup)

This means the boilerplate works immediately without a Resend account.

### OTP generation

Auth now generates 6-digit codes instead of long tokens:

```
Before: 15495918630ff4675935a1289c6c81c0144df41cedcde4c60ffe420d096f8ee3
After:  482917
```

### Sending emails (`src/lib/email.ts`)

```ts
import { sendOTPEmail } from "@/lib/email";

await sendOTPEmail("user@example.com", "482917");
```

For other transactional emails, add functions to the same file:

```ts
export async function sendWelcomeEmail(email: string, name: string) {
  await getResend().emails.send({
    from: process.env.EMAIL_FROM!,
    to: email,
    subject: "Welcome!",
    html: `<p>Hi ${name}, thanks for signing up.</p>`,
  });
}
```

## Setup (when ready to send real emails)

1. Create a free account at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Add it to `.env`:

```
RESEND_API_KEY="re_xxxxxxxxxxxxx"
EMAIL_FROM="onboarding@resend.dev"
```

4. For production, verify your own domain in Resend and update `EMAIL_FROM`:

```
EMAIL_FROM="hello@yourdomain.com"
```

## Environment variables

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Resend API key (empty = console fallback) |
| `EMAIL_FROM` | Sender email address |

## Files

- `src/lib/email.ts` — Resend client and email sending functions
- `src/lib/auth.ts` — updated to use 6-digit OTP and Resend
