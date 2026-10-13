# Module 6: API Layer

## Choices

| Decision | Choice |
|----------|--------|
| Primary API pattern | Server Actions |
| Secondary API pattern | Route Handlers (for webhooks, external APIs) |

## Why Server Actions

- **Zero setup** — built into Next.js, no extra libraries
- **Type safe** — same TypeScript on client and server, no schema to maintain
- **Simple** — mark a function `"use server"`, call it from a component
- **Secure by default** — server actions never expose code or secrets to the client

## How it works

### Server Actions (`src/actions/`)

Server actions are async functions that run on the server. Put them in `src/actions/` organized by domain.

```tsx
// src/actions/user.ts
"use server";

import { db } from "@/lib/db";

export async function updateUserName(name: string) {
  // This runs on the server — safe to use db, secrets, etc.
  return db.user.update({
    where: { id: session.user.id },
    data: { name },
  });
}
```

Call them from components:

```tsx
// In a server component — call directly
const user = await getCurrentUser();

// In a client component — call from event handlers or forms
<button onClick={() => updateUserName("New Name")}>Update</button>

// In a form — use the action prop
<form action={updateUserName}>
  <input name="name" />
  <button type="submit">Update</button>
</form>
```

### Route Handlers (`src/app/api/`)

For endpoints that external services need to call (webhooks, OAuth callbacks, etc.), use Route Handlers:

```tsx
// src/app/api/webhooks/stripe/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  // Handle webhook
  return Response.json({ received: true });
}
```

## When to use which

| Use case | Pattern |
|----------|---------|
| Form submissions | Server Action |
| Data mutations (create, update, delete) | Server Action |
| Data fetching in server components | Direct `db` calls or Server Action |
| Webhooks from external services | Route Handler |
| Public API endpoints | Route Handler |
| File uploads | Route Handler |

## Conventions

- **One file per domain** — `src/actions/user.ts`, `src/actions/project.ts`, etc.
- **Always check auth** — call `auth()` at the top of every action that requires login
- **Return data, not responses** — server actions return plain objects, not `Response`
- **Validate input** — add validation (covered in a later module if needed) before database operations

## Files

- `src/actions/user.ts` — example server actions for user operations
- `src/app/api/auth/[...nextauth]/route.ts` — existing route handler (from Module 5)
