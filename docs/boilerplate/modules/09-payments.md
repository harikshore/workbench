# Module 9: Payments

## Status: Not installed — add per project when needed

## Recommendation

| Decision | Choice |
|----------|--------|
| Provider | Stripe |
| Why | Industry standard, excellent docs, generous test mode, supports one-time and subscriptions |

## When to add

Add Stripe when your project needs:
- One-time purchases
- Subscriptions / recurring billing
- Usage-based pricing

## How to add (when needed)

```bash
pnpm add stripe @stripe/stripe-js
```

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Add keys to `.env`:

```
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

3. Create a webhook route handler at `src/app/api/webhooks/stripe/route.ts`
4. Use Stripe Checkout for payment pages (hosted by Stripe — no PCI compliance burden)

## Alternatives

- **Lemon Squeezy** — simpler than Stripe, handles tax/VAT automatically, good for digital products
- **Paddle** — merchant of record (they handle tax, invoicing, compliance)
