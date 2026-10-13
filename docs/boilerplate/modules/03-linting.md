# Module 3: Linting & Formatting

## Choices

| Decision | Choice |
|----------|--------|
| Linter | ESLint (Next.js defaults — no custom rules) |
| Formatter | Prettier 3.9 |
| Conflict resolution | `eslint-config-prettier` disables ESLint rules that clash with Prettier |

## Prettier config

Defined in `.prettierrc`:

- Semicolons: yes
- Quotes: double
- Tab width: 2 spaces
- Trailing commas: all
- Line width: 80 characters

These are Prettier's defaults — the config file exists so they're explicit and won't change if Prettier's defaults ever shift.

## How to use

Prettier formats automatically on save if your editor is configured (VS Code does this with the Prettier extension). You can also run it manually:

```bash
# Check formatting
pnpm prettier --check "src/**/*.{ts,tsx,css}"

# Fix formatting
pnpm prettier --write "src/**/*.{ts,tsx,css}"
```

## Files

- `.prettierrc` — Prettier config
- `eslint.config.mjs` — ESLint config (Next.js defaults + prettier compat)
