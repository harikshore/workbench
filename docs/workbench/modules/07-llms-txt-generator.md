# 07 — llms.txt Generator

**Status:** Planned  
**Route:** `/dashboard/llms`

## Overview

A utility that generates an `llms.txt` file for any website. The `llms.txt` standard provides a structured way for websites to communicate with LLMs — describing the site's purpose, key pages, and how AI should interact with its content. Each user gets one generation credit (free tier constraint).

## Planned features

- Input: user provides a website URL
- Scraper/crawler fetches key pages and metadata from the target site
- AI processes the crawled content and generates a standards-compliant `llms.txt`
- Preview the generated `llms.txt` before downloading
- One generation per account (credit-based, free tier)
- Download as `.txt` file

## Open questions

- Crawling approach: server-side fetch, headless browser, or external API
- Depth of crawl (homepage only vs. sitemap traversal)
- AI model for content synthesis
- llms.txt spec version to target
- How to handle sites that block crawlers (robots.txt, rate limits)
- Credit reset mechanism (if any)

## Test cases

### Generation flow
- [ ] Enter a valid URL → crawl starts, loading state shown
- [ ] Crawl completes → AI generates `llms.txt`, preview displayed
- [ ] Preview shows valid `llms.txt` format
- [ ] "Download" button → saves `.txt` file to user's device
- [ ] Credit consumed after successful generation

### Credit system
- [ ] New user has 1 credit available
- [ ] After generation, credit is consumed — "Generate" button disabled
- [ ] UI clearly shows remaining credits (1/1 or 0/1)
- [ ] User with 0 credits sees explanation, no generate button

### Validation
- [ ] Empty URL → validation error
- [ ] Malformed URL (no protocol, invalid domain) → validation error
- [ ] URL that returns 404/500 → error message, credit not consumed
- [ ] Site that blocks crawling → appropriate error, credit not consumed

### Preview and download
- [ ] Generated `llms.txt` displays in a code/monospace preview
- [ ] Content follows `llms.txt` standard format
- [ ] Download produces a valid `.txt` file with correct content
- [ ] Filename includes the target domain (e.g. `llms-example-com.txt`)

### Edge cases
- [ ] Unauthenticated user → redirected to login
- [ ] Very large site → crawl limited to reasonable scope, result still generated
- [ ] Site with minimal content → `llms.txt` still generated with available info
- [ ] Network timeout during crawl → error message, credit not consumed
- [ ] Concurrent generation attempts → prevented, only one at a time
