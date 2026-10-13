# Module 4: Database & ORM

## Choices

| Decision | Choice |
|----------|--------|
| Database | MongoDB Atlas |
| ORM | Prisma 6 |
| Connection | Via `DATABASE_URL` environment variable |

## Why MongoDB

- Flexible documents — no rigid schema migrations during rapid prototyping
- MongoDB Atlas has a generous free tier and handles scaling
- Good fit for MVPs where the data model is still evolving

## Why Prisma

- **Type safety** — auto-generates TypeScript types from your schema. Every query is fully typed.
- **Single schema** — define models once in `schema.prisma`, types and queries are generated.
- **Database-agnostic** — if you later switch to Postgres, change one line in the schema.
- **Simple API** — `db.user.findMany()` instead of raw MongoDB queries.

## How it's set up

### Schema (`prisma/schema.prisma`)

Defines your data models. The boilerplate includes a starter `User` model:

```prisma
model User {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

MongoDB-specific: `@map("_id")` and `@db.ObjectId` map to MongoDB's native ID field.

### Database client (`src/lib/db.ts`)

A singleton that prevents too many connections during Next.js hot reloads in development:

```ts
import { db } from "@/lib/db";

const users = await db.user.findMany();
```

### Config (`prisma.config.ts`)

Points Prisma to the schema file location.

### Environment (`.env`)

```
DATABASE_URL="mongodb+srv://USERNAME:PASSWORD@cluster.xxxxx.mongodb.net/DATABASE_NAME"
```

Get your connection string from MongoDB Atlas → Connect → Drivers.

## Commands

```bash
pnpm db:generate   # Regenerate Prisma client after schema changes
pnpm db:push       # Push schema changes to the database
pnpm db:studio     # Open Prisma Studio (visual DB browser)
```

## Workflow

1. Edit `prisma/schema.prisma` — add/change models
2. Run `pnpm db:generate` — regenerates TypeScript types
3. Run `pnpm db:push` — syncs schema to MongoDB Atlas
4. Use `db` from `@/lib/db` in server components / API routes

## Files

- `prisma/schema.prisma` — data model definitions
- `prisma.config.ts` — Prisma configuration
- `src/lib/db.ts` — database client singleton
- `.env` — connection string (gitignored)
- `.env.example` — template for the connection string
