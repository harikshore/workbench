# Module 7: UI Components

## Choices

| Decision | Choice |
|----------|--------|
| Component library | shadcn/ui (copy-paste, not a dependency) |
| Primitives | Radix UI (under the hood of shadcn/ui) |
| Custom UI | Build from scratch with Tailwind when designs require it |
| Class merging | `cn()` utility from `src/lib/utils.ts` |

## Why shadcn/ui

- **You own the code** — components are copied into your project, not imported from a package
- **Fully customizable** — change anything, no fighting a library's opinions
- **Accessible** — built on Radix UI primitives (keyboard nav, screen readers, focus management)
- **Tailwind native** — uses the same CSS tokens from Module 2
- **No lock-in** — delete a component and replace with your own anytime

## How it works

### Adding components

```bash
# Add a single component
npx shadcn@latest add dialog

# Add multiple
npx shadcn@latest add dialog dropdown-menu toast

# Browse all available components
npx shadcn@latest add
```

Components are placed in `src/components/ui/`. They're regular TypeScript files you can edit freely.

### Using components

```tsx
import { Button } from "@/components/ui/button";

<Button variant="default">Click me</Button>
<Button variant="outline">Cancel</Button>
<Button variant="destructive">Delete</Button>
```

### Custom components

For custom designs (dashboards, complex layouts, etc.), build directly with Tailwind:

```tsx
// src/components/stat-card.tsx
export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
```

### The `cn()` utility

Merges Tailwind classes and handles conflicts:

```tsx
import { cn } from "@/lib/utils";

<div className={cn("p-4 bg-card", isActive && "bg-primary text-primary-foreground")} />
```

## Design workflow

1. Design in Claude → export via MCP → implement in code
2. Use shadcn/ui components where they fit (buttons, forms, dialogs, dropdowns)
3. Build custom components for unique designs (dashboards, data viz, custom layouts)
4. Both use the same Tailwind tokens from `globals.css`

## Component organization

```
src/components/
  ui/               → shadcn/ui components (managed by CLI)
  theme-provider.tsx → dark/light mode provider
  stat-card.tsx      → custom components live here alongside ui/
```

## Files

- `src/components/ui/button.tsx` — starter shadcn/ui component
- `src/lib/utils.ts` — `cn()` class merging utility
- `components.json` — shadcn/ui configuration
