# Module 10: Deployment

## Status: Not configured — choose per project

## Recommended stack

| Concern | Recommendation |
|---------|---------------|
| App hosting | Vercel (default), Railway or Render as alternatives |
| Database | MongoDB Atlas (always — don't co-host with your app) |
| Environment vars | Managed in hosting provider's dashboard |

## Hosting options

### Vercel (default for most projects)

- Zero-config Next.js deploys — push to `main`, it's live
- Preview deploys for every PR
- Generous free tier (100GB bandwidth, serverless functions)
- Edge network for fast global delivery
- **Limitation:** serverless function timeout (10s free, 60s pro) — not ideal for long-running jobs

```bash
# Deploy
pnpm add -g vercel
vercel
```

### Railway (when you need more control)

- Full Node.js server (no function timeouts)
- Can run background workers, cron jobs, Redis alongside your app
- $5 free credit/month
- Good for apps with long-running processes

### Render (budget-friendly alternative)

- Free tier for web services (spins down on inactivity)
- Straightforward Docker or Node.js deploys
- Good for side projects and early MVPs

## When to use which

| Scenario | Choice |
|----------|--------|
| Standard web app, fast iteration | Vercel |
| Background jobs, workers, cron | Railway |
| Budget-conscious side project | Render |
| Full infrastructure control | Docker + any cloud |

## Environment variables

Each hosting provider has its own dashboard for env vars. Copy from `.env.example` and fill in production values:

```
DATABASE_URL        → MongoDB Atlas production cluster
AUTH_SECRET         → Generate with: openssl rand -base64 32
AUTH_URL            → Your production domain
RESEND_API_KEY      → Production Resend key
EMAIL_FROM          → Your verified domain email
STRIPE_SECRET_KEY   → (if using payments) Production Stripe key
```

## Pre-deploy checklist

1. Set all env vars in hosting provider
2. Verify MongoDB Atlas network access allows your hosting provider's IPs
3. Run `pnpm build` locally to catch errors before deploying
4. Generate a real `AUTH_SECRET` for production
5. Verify your domain in Resend and update `EMAIL_FROM`
