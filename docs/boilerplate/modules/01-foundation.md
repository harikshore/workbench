# Module 1: Project Foundation

## Choices

| Decision | Choice | Version |
|----------|--------|---------|
| Framework | Next.js (App Router) | 16.4 |
| Language | TypeScript | 5.9 |
| Package manager | pnpm | 11.22 |
| Runtime | Node.js | 24.x |
| Bundler | Turbopack (dev) | built-in |
| CSS | Tailwind CSS | 4.3 |

## Why Next.js over MERN

- **Single codebase, single deploy** — no separate frontend/backend repos
- **Server Components** — data fetching on the server by default, less client JS
- **Built-in SSR/SSG** — SEO and performance without extra setup
- **Ecosystem** — shadcn/ui, NextAuth, tRPC, Vercel all integrate natively
- **Natural server/client boundary** — enforced at build time, not by convention

MERN would only win if we needed a standalone API consumed by multiple clients (web, mobile, third-party). For a web app MVP, that's premature.

## Why these defaults

- **TypeScript** — catches bugs early, better DX with autocomplete, non-negotiable for production code
- **pnpm** — strict dependency resolution (no phantom deps), faster installs, saves disk space
- **Turbopack** — Next.js's Rust-based dev bundler, significantly faster HMR than Webpack
- **Tailwind CSS** — utility-first, no context switching to CSS files, pairs well with component libraries like shadcn/ui. Included at scaffold time since it's tightly integrated with Next.js 16+

## Project structure

```
src/
  app/              → App Router routes, pages, layouts (server by default)
    api/            → API route handlers (added as needed)
    layout.tsx      → Root layout
    page.tsx        → Home page
    globals.css     → Global styles + Tailwind imports
```

## What's next

As we add modules, the `src/` directory will grow:

```
src/
  app/              → routes & pages
  components/       → UI components
  server/           → server-only business logic, db, services
  lib/              → shared utilities
```
