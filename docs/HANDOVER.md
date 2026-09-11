# Deployment and operation

## Connections to finish

The target is `unique-point/car-trailers`. The connected GitHub account is `lead0007`; organisation installation and repository write access are now confirmed. The existing repository was empty before this source submission. Work is submitted on `build/car-trailers-storefront` for review. No replacement repository has been created.

The user confirms the domain is on Cloudflare. No authenticated Cloudflare account, existing Pages/Workers application, zone configuration, Stripe account or transactional mail account has been inspected. Do not claim any deployment or DNS change is complete.

## Preview deployment

1. Inspect the owner's existing Cloudflare project and domain configuration. This implementation targets Workers through the current Astro adapter. If an existing Pages application is in use, document a migration proposal before modifying it.
2. Create or select a dedicated preview D1 database. Apply `migrations/0001_commerce.sql`. Enable Cloudflare Access for the entire preview hostname and disable indexing.
3. In GitHub, create the `preview` environment. Set `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as environment secrets. Grant the token only the Worker and D1 permissions needed for this deployment.
4. Set `CLOUDFLARE_CONFIG_JSON` as an environment variable. It supplies the confirmed Worker name, HTTPS preview origin, preview D1 ID, any existing session KV binding and Workers route settings. See `scripts/deployment-config.mjs` for allowed fields. No credentials belong in this JSON.
5. Configure Worker runtime secrets with the Cloudflare dashboard or `wrangler secret put`. GitHub deployment secrets and Worker runtime secrets are different settings.
6. Run the Validate workflow, then the explicit Deploy workflow for preview. Review the terminal deployment result and check the deployed URL, API responses, database schema, logs and Access policy.
7. Connect a Stripe test key and test webhook endpoint `/api/stripe/webhook`. Enable test commerce only with synthetic records in the preview database. Conduct the remaining real Stripe test scenarios in `VALIDATION.md`.

Do not reuse the placeholder ID in `wrangler.jsonc`. The release validation command rejects it. Never put production Stripe keys in preview; the backend rejects non-test secret keys outside production.

## Production

Create a separate GitHub `production` environment and separate D1/Stripe/runtime settings. Protect it with a reviewer and a selected release branch. Set APP_ORIGIN to `https://www.car-trailers.com.au`. Bind the existing domain only after reviewing the existing DNS and hosting application. Use a Cloudflare redirect rule or Worker route for apex-to-www with paths and queries preserved. Do not alter mail, verification or unrelated records.

Only enable COMMERCE_ENABLED after approved catalogue records, terms, tax treatment, stock or lead times, collection fees and payment rules have been configured and the real Stripe test checklist passes. Only enable ENQUIRIES_ENABLED after the privacy policy, contact details, notifications and Turnstile are complete. Production enquiries require both TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY. Both the server and client validate the returned token; the backend verifies the hostname and `quote` action.

Set PUBLIC_INDEXING_ENABLED=true at build time and INDEXING_ENABLED=true at runtime only for the approved production launch. Confirm rendered robots metadata and robots.txt. Preview uses noindex and should also be behind Access. There is no fabricated business address or rating schema. The existing approved banner is reused for sharing metadata.

## Runtime settings

See `.env.example` and `src/lib/env.ts`. Core flags: APP_ENV, APP_ORIGIN, COMMERCE_ENABLED, ENQUIRIES_ENABLED, NOTIFICATIONS_ENABLED, INDEXING_ENABLED. Secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, TURNSTILE_SECRET_KEY, RATE_LIMIT_SALT, RESEND_API_KEY. Staff configuration: ACCESS_TEAM_DOMAIN, ACCESS_AUD, ADMIN_ROLES_JSON. Mail configuration: MAIL_FROM, BUSINESS_NOTIFICATION_EMAIL, TEST_NOTIFICATION_EMAIL.

Notifications use Resend's HTTP API and per-message idempotency keys. Verify the sender domain and addresses. Outside production, only TEST_NOTIFICATION_EMAIL receives messages. The preview fixture test suite makes no real Stripe or mail requests.

## Staff access

Protect `/admin*` and `/api/admin*` with the same Cloudflare Access application. Set its team domain and audience. ADMIN_ROLES_JSON maps approved email addresses to `viewer`, `sales` or `manager`. The Worker verifies the JWT signature, issuer, audience and expiry, then applies its own role check. A plain email header is insufficient. There is no hard-coded admin password or development login bypass.

Viewer: read and export records. Sales: update enquiry/order progress and create a balance link. Manager: also edit approved commercial configuration and request refunds. A refund requires an explicit amount, reason and confirmation in the management interface. Audit records are retained. Exports contain private customer information and should be kept in the company's approved storage.

## Catalogue publication

Public narrative, images, provisional design families and page structure are in `src/data/catalogue.ts`, `src/pages` and `assets/masters`. Edit these on a branch, review, build and deploy. Do not assume every illustration is a different SKU. Product-family grouping must be reconciled with the actual schedule before online selling.

The live commercial record is validated by `commercialSchema` in `src/lib/pricing.ts`. Use the commercial catalogue editor in `/admin/` to create a record for an existing public product ID, then increment revision for each update. A record includes approved price in integer AUD cents, GST-inclusive treatment, availability, lead time, options and exclusions, collection location and charges, deposit rule and confirmed specifications. The staff editor currently exposes the full structured configuration; nontechnical bulk catalogue editing can be improved after the actual schedule is supplied. Stock means available units excluding reservations. A null stock value represents made-to-order, with a confirmed lead time.

Browser checkout always supplies the selected revision and displayed total. The server recalculates from the current D1 record; mismatches require customer review. The database also checks the commercial revision inside the stock reservation transaction. Customer-submitted prices are never used as authority.

Current supported fulfilment is an approved collection location per commercial product. Mixed locations and unconfirmed delivery remain quote-only. Collection fees and extras form part of each configured line's deposit basis. Fixed deposits apply per trailer; percentages are stored as integer basis points. These rules must be explicitly approved by the business. Only GST-inclusive AUD configurations are accepted in this release. Other tax treatments need a deliberate implementation change.

## Payment operations

Orders and priced configuration snapshots are written before requesting a Stripe Checkout session. Atomic database triggers reserve stock. An API/network error does not release a reservation until the session's outcome is known. A success-page visit cannot mark paid. The webhook verifies the signature and retrieves the current Stripe session so stale events cannot undo payment.

One unique checkout exists for the initial payment and one for the balance. Duplicate callbacks cannot add the same payment twice or repeat the outbox entry. Deposit and full payment are distinct from production/collection progress. Initial session expiry releases held stock once; a paid order keeps its stock deduction. Refunds do not automatically restock a trailer. Staff need to inspect its production and physical status first.

The scheduled handler runs reconciliation and notification retries every ten minutes. An unresolved session creation is held for staff review rather than automatically retried beyond the idempotency window. Expired balance links currently require a staff recovery procedure; do not manually reset their row and risk charging twice. Check Stripe before creating a separately approved replacement or invoice.

Order status is tied to a random HttpOnly cookie stored during checkout. Only payment/progress totals are returned. Cross-device recovery currently requires staff support. Email confirmations include the reference, configuration, payment, remaining balance and collection details. No customer information is sent to analytics.

## Backups, rollback and incidents

Enable D1 Time Travel and confirm the account's retention period. Export D1 before migrations and retain encrypted backups outside the public source repository. Use additive migrations. Review destructive changes separately, and verify restoration in preview.

For a bad code release, roll back to the prior verified Worker version. Do not blindly roll the database back behind successful Stripe payments. If payment state is uncertain, disable new checkout, preserve webhook handling, reconcile Stripe sessions and refunds, and resolve the outbox before re-enabling sales. An older code release must remain compatible with the current additive schema.

Inspect Cloudflare errors and the staff audit/notification views. Pending outbox entries with eight attempts need investigation. Avoid logging request bodies, credentials, emails or payment details. Configure the business's monitoring and alert destination before launch.

## Information still needed from the business

- Approved product/variant schedule, image-to-SKU mapping, specifications, prices, inclusions and available stock or made-to-order lead times.
- Deposit and balance rules, GST treatment, collection locations/fees, freight policy and custom-order handling.
- Trading/contact details, ABN where applicable, warranty, purchase, cancellation, returns and privacy terms.
- Cloudflare project access, Stripe test/production connection, approved staff accounts, mail sender and controlled test recipient.
- Approved analytics and Search Console identifiers. No analytics property has been connected and no live measurement is claimed.
