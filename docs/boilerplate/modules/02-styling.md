# Module 2: Styling

## Choices

| Decision | Choice |
|----------|--------|
| CSS framework | Tailwind CSS 4.3 (installed with foundation) |
| Dark mode | `next-themes` — supports dark / light / system |
| Fonts | `next/font/google` — self-hosted at build time |
| Color tokens | CSS custom properties mapped to Tailwind via `@theme inline` |

## Theme setup

### How it works

Color tokens are defined as CSS custom properties in `globals.css`:

```css
:root { --primary: #2563eb; }
.dark { --primary: #3b82f6; }
```

These are mapped to Tailwind classes via `@theme inline`:

```css
@theme inline { --color-primary: var(--primary); }
```

Then used in components as regular Tailwind classes:

```tsx
<button className="bg-primary text-primary-foreground">Click me</button>
```

### Available tokens

| Token | Purpose |
|-------|---------|
| `background` / `foreground` | Page background and default text |
| `primary` / `primary-foreground` | Brand color and its contrast text |
| `muted` / `muted-foreground` | Subdued surfaces and secondary text |
| `border` | Default border color |
| `success` | Positive state |
| `error` | Negative state |

To customize per project, change the CSS variable values in `globals.css`. All Tailwind classes update automatically.

## Dark mode

Managed by `next-themes` via ThemeProvider in the root layout.

- **Default:** system (follows OS preference)
- **Override:** users can switch to light or dark
- **How it works:** `next-themes` adds a `dark` class to `<html>`, Tailwind picks it up via `.dark { }` selectors in `globals.css`

The ThemeProvider is at `src/components/theme-provider.tsx`.

## Fonts

Using `next/font/google` in `layout.tsx`:

- **Geist** — sans-serif body font
- **Geist Mono** — monospace font for code

These are downloaded at build time and self-hosted — no external requests at runtime.

### Using local fonts

To use a custom font file instead of Google Fonts:

```tsx
import localFont from "next/font/local";

const myFont = localFont({
  src: "./fonts/MyFont.woff2",
  variable: "--font-custom",
});
```

Place `.woff2` files in `src/app/fonts/` and reference them with the CSS variable.

## CSS conventions

- **`globals.css`** — Tailwind import, color tokens, base styles. The only CSS file.
- **Everything else** — Tailwind utility classes directly in components.
- **No `@apply`** — make a React component instead of a CSS class.
- **Arbitrary values** — use `w-[347px]` or `text-[#1a2b3c]` for one-off design specs.

## Files

- `src/app/globals.css` — color tokens and Tailwind config
- `src/app/layout.tsx` — font loading and ThemeProvider
- `src/components/theme-provider.tsx` — next-themes wrapper
