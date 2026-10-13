# Module 5: Auth

## Choices

| Decision | Choice |
|----------|--------|
| Auth library | NextAuth v5 (Auth.js beta) |
| Login method | Email OTP (passwordless) |
| Session strategy | JWT (stateless, no DB lookup per request) |
| Database adapter | @auth/prisma-adapter (stores users in MongoDB via Prisma) |
| Email service | Console log for now — Resend in Module 8 |

## Why NextAuth

- Free and open-source — no per-user pricing
- No vendor lock-in — your users stay in your database
- Native Next.js integration — middleware, server components, API routes
- Supports adding OAuth providers (Google, GitHub) later without rewriting

## How it works

### The Email OTP flow

1. User enters their email on `/login`
2. NextAuth generates a verification token and calls `sendVerificationRequest`
3. Currently logs the OTP to console — will email via Resend after Module 8
4. User enters OTP on `/verify`
5. NextAuth verifies the token, creates/finds the user, returns a JWT session

### Auth config (`src/lib/auth.ts`)

Central auth configuration. Exports:
- `handlers` — GET/POST handlers for the `/api/auth/*` routes
- `auth` — get the current session in server components
- `signIn` / `signOut` — trigger sign in/out from server actions

### Usage in server components

```tsx
import { auth } from "@/lib/auth";

export default async function Page() {
  const session = await auth();

  if (!session) {
    return <p>Not signed in</p>;
  }

  return <p>Welcome, {session.user.name}</p>;
}
```

### Middleware (`src/middleware.ts`)

Runs on every request (except static assets and API routes). Currently just attaches the session — does not block unauthenticated users. To protect routes, add logic in the middleware or check `session` in individual pages.

## Prisma schema additions

NextAuth requires these models (added to `prisma/schema.prisma`):

- `Account` — stores OAuth provider connections (for future use)
- `Session` — database sessions (backup to JWT)
- `VerificationToken` — stores OTP/magic link tokens

## Environment variables

```
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_URL="http://localhost:3000"
```

## What's next

- Module 8 (Email) will replace the console.log with actual email delivery via Resend
- Login and verify pages need to be built (Module 7 — UI components)
- OAuth providers (Google, GitHub) can be added by extending the `providers` array

## Files

- `src/lib/auth.ts` — NextAuth configuration
- `src/app/api/auth/[...nextauth]/route.ts` — API route handler
- `src/middleware.ts` — request middleware
- `prisma/schema.prisma` — updated with auth models
