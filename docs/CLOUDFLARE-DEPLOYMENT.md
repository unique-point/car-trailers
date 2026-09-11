# Cloudflare deployment

Status: deployed for browsing and review on 11 September 2026.

URL: https://car-trailers-australia-preview.unique-point.workers.dev/
Source commit: 66542a41a8338832dec6d427ad73f8f822433932
Cloudflare version: 342061ba-36b8-42e1-ab41-d40615c2cea2
GitHub Actions run: https://github.com/unique-point/car-trailers/actions/runs/34629613710

Resources:
- Worker: car-trailers-australia-preview
- D1: car-trailers-preview, 25b255d2-43ce-4570-abb0-0b67e349f6c3
- SESSION KV: ec7b82dcd1b1481da6f287c8b6b85c3a
- No custom domains or DNS records changed.

GitHub installed dependencies, passed Astro checks and all 18 tests, built the source, applied the initial schema and deployed 75 static assets plus the server Worker. Live HTTP checks passed for the homepage, shop, product page, logo, headquarters image, catalogue API and crawl block. Cloud browser verification confirmed the header logo and hero image, search filtering to one enclosed design, and saved requirements preserved into the selection page. The shared footer includes the approved logo on a white panel. Mobile behaviour has not been reverified in this continuation.

The first migration attempt failed with incomplete SQL input. Stock-check trigger expressions were rewritten from CASE/END expressions to SELECT RAISE WHERE expressions. All 18 tests passed afterwards and the remote migration succeeded on retry.

This deployment is public for review but requests no indexing. Payments, enquiry capture and outgoing notifications are disabled. It is not an operating online shop. No private client records or payment credentials were seeded. The admin endpoints retain authentication checks.

Next hosting step: inspect existing DNS records for car-trailers.com.au, then connect the approved canonical hostname while preserving unrelated records. Account token permits Worker deployment, D1 and KV operations, and routes scoped to car-trailers.com.au. It does not include DNS read/edit permissions. The user can supply the DNS screen without revealing the API token.

Before trading: obtain and configure approved commercial records, contact/trading details, policies, Stripe test and live connections, Turnstile, mail delivery and staff Access settings. Complete the real service tests documented in HANDOVER.md and VALIDATION.md.

The first-deployment workflow intentionally refuses to overwrite an existing Worker. Do not rerun it expecting updates. Use the configured deployment workflow with the confirmed environment configuration for subsequent releases, or implement an update workflow tied to this verified Worker. The successful generated configuration uses APP_ENV=preview, the workers.dev APP_ORIGIN, the D1 and KV IDs above, workers_dev=true, no custom routes and no cron schedules. Secrets remain in GitHub and must never be printed or committed.

This document supersedes the earlier not-deployed status in LAUNCH-STATUS-2026-09-11.md.
