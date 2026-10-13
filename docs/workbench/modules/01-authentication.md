# 01 — Authentication

**Status:** Live  
**Route:** `/dashboard` (entry point via `/login`)

## Overview

Passwordless sign-in using one-time email codes (OTP). No passwords stored — users receive a 6-digit code via email, valid for 10 minutes. Built on NextAuth v5 with a custom `email-otp` provider, Resend for transactional email, and MongoDB for session/token storage.

## How it works

1. User enters email on `/login`
2. Server generates a 6-digit OTP, stores a hashed verification token in MongoDB
3. Resend sends a Modernist-styled HTML email with the code
4. User enters code on `/verify`
5. Verification hits `/api/auth/callback/email-otp` via `window.location.href` redirect (not `signIn()` from next-auth/react)
6. On success: JWT session created, `lastActiveAt` updated, user redirected to `/dashboard`
7. First-time users go through `/onboarding` (name, country, timezone) before reaching the dashboard

## Key files

- `src/lib/auth.ts` — NextAuth config, email-otp provider, signIn callback
- `src/lib/email.ts` — OTP email template (Modernist-styled HTML, dark mode, preheader)
- `src/actions/auth.ts` — `sendOTP` server action
- `src/app/(auth)/login/login-form.tsx` — Email input form
- `src/app/(auth)/verify/verify-form.tsx` — OTP verification form
- `src/app/(auth)/onboarding/onboarding-form.tsx` — First-time setup
- `prisma/schema.prisma` — User, Account, Session, VerificationToken models

## Implementation details

- OTP expiry: 10 minutes (`maxAge: 600`)
- Email fallback: if `RESEND_API_KEY` is empty, OTP logs to console
- Session strategy: JWT (not database sessions)
- `lastActiveAt` updated on every sign-in via `signIn` callback
- Email template: table-based HTML with dark mode via `prefers-color-scheme`, Outlook MSO conditionals

## Test cases

### Happy path
- [ ] Enter valid email → receive OTP email within 30 seconds
- [ ] Enter correct 6-digit OTP → redirected to `/dashboard`
- [ ] First-time user → redirected to `/onboarding` before dashboard
- [ ] Returning user (already onboarded) → goes straight to dashboard
- [ ] OTP email renders correctly in Gmail, Apple Mail, Outlook

### Validation
- [ ] Empty email field → "Enter a valid email address." error shown
- [ ] Malformed email (e.g. `foo@`) → "Enter a valid email address." error shown
- [ ] OTP shorter than 6 digits → "The code is 6 digits." error shown
- [ ] Non-numeric characters stripped from OTP input (only digits accepted)

### Expiry and edge cases
- [ ] OTP entered after 10 minutes → verification fails, user stays on `/verify`
- [ ] Wrong OTP entered → verification fails
- [ ] "Resend" button on `/verify` → sends a new OTP, button text changes to "Sent again"
- [ ] "Use a different email" link → returns to `/login`
- [ ] Multiple OTPs requested → only the latest OTP is valid

### Onboarding
- [ ] Name field is required — empty name shows "Name is required." error
- [ ] Country select populates timezone dropdown
- [ ] "Skip for now" → completes onboarding with defaults, reaches dashboard
- [ ] "Finish setup" → saves name, country, timezone, marks `onboarded: true`

### Session
- [ ] Authenticated user visiting `/login` → redirected to `/dashboard`
- [ ] Unauthenticated user visiting `/dashboard` → redirected to `/login`
- [ ] Sign out from sidebar → session destroyed, redirected to `/login`
- [ ] `lastActiveAt` is updated in the database on each sign-in
