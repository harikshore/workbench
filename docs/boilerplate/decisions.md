# MVP Boilerplate — Technology Decisions

Quick-reference for every tech choice in this boilerplate.

| # | Module | Choice | Status |
|---|--------|--------|--------|
| 1 | Project foundation | Next.js 16 + TypeScript + pnpm + Turbopack + Tailwind | Done |
| 2 | Styling | Tailwind tokens + next-themes (dark/light/system) + next/font | Done |
| 3 | Linting & formatting | ESLint defaults + Prettier | Done |
| 4 | Database & ORM | MongoDB Atlas + Prisma 6 | Done |
| 5 | Auth | NextAuth v5 + Email OTP + JWT sessions | Done |
| 6 | API layer | Server Actions + Route Handlers | Done |
| 7 | UI components | shadcn/ui + custom Tailwind | Done |
| 8 | Email | Resend (with console fallback) | Done |
| 9 | Payments | Stripe (documented, not installed — add per project) | Done |
| 10 | Deployment | Vercel / Railway / Render (choose per project) | Done |
| 11 | Testing | Vitest + Playwright (documented, not installed — choose per project) | Done |

Each module has a detailed doc in [`docs/modules/`](modules/).
