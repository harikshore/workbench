# Module 11: Testing

## Status: Not installed — choose per project

## Recommendation

| Level | Tool | When to add |
|-------|------|-------------|
| Unit + integration | Vitest | When you want fast tests for functions, server actions, utils |
| E2E (browser) | Playwright | When you need to test full user flows (sign in, checkout, etc.) |

## How to add Vitest (when needed)

```bash
pnpm add -D vitest @vitejs/plugin-react
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Add script to `package.json`:

```json
"test": "vitest",
"test:run": "vitest run"
```

Example test:

```ts
// src/lib/__tests__/example.test.ts
import { describe, it, expect } from "vitest";

describe("example", () => {
  it("works", () => {
    expect(1 + 1).toBe(2);
  });
});
```

## How to add Playwright (when needed)

```bash
pnpm add -D @playwright/test
npx playwright install
```

Example test:

```ts
// e2e/home.spec.ts
import { test, expect } from "@playwright/test";

test("homepage loads", async ({ page }) => {
  await page.goto("http://localhost:3000");
  await expect(page).toHaveTitle(/MVP Boilerplate/);
});
```

## Alternatives worth exploring

- **Jest** — older, larger ecosystem, more config needed
- **Cypress** — E2E alternative to Playwright, visual test runner
- **Testing Library** — for testing React components (works with Vitest or Jest)
