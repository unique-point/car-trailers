# Verification record

## Completed

- `npm run check`: 54 source files, zero errors, warnings or hints at the last full check.
- `npm test`: 18 passing tests using Node's test runner, an in-memory SQLite database loaded from the actual migration and a mocked Stripe HTTP service.
- `npm run build`: successful Astro 7 production build with prerendered storefront pages, Cloudflare Worker endpoints, static assets and generated Wrangler configuration.
- All 42 WebP derivatives were decoded successfully after correcting three incomplete image exports. Fourteen original PNG masters are preserved.
- Browser: homepage renders with the approved banner; catalogue search for “cage” returns three designs; a comparison control changes its selected state; product navigation works; requirements and a quantity of two save into the selection and appear on the cart page; the quote route is reachable.
- Source includes mobile layouts, labelled fields, visible focus, reduced motion, a skip link and mobile selection/comparison navigation.

## Commerce scenarios covered

Exact full-price calculation including options and collection; percentage and fixed deposits; manipulated totals; stale commercial revisions; unknown/incompatible options; unconfirmed freight; disabled catalogue entries; stock reservation; immutable priced snapshots; cookie-protected order access; duplicate successful callbacks; expired session release; forged signatures; delayed events resolved against current Stripe state; amount mismatches; concurrent requests for the last unit; request/session reuse; durable quotation capture; origin validation; disabled launch gates; staff authentication without an unsafe fallback; refund idempotency; deposit balance settlement; successful-payment replay after refund; rollback when the requested items cannot be reserved.

## Still required before launch

- Run real Stripe test-mode Checkout using the owner's account. Cover 3DS/authentication challenges, declines, cancellation, closed-browser recovery, expiry, real webhook delivery/retries, balance collection and refunds. Current automated Stripe responses are mocks, not completed Stripe transactions.
- Apply migrations and exercise the handlers against the real preview D1 database. The current transactional tests use SQLite semantics locally.
- Connect Cloudflare Access and test each real staff role. Manager changes/refund interfaces have been type checked but not exercised with an authenticated staff session.
- Verify Resend sender and controlled test recipient, receipt content, delivery and retries. No real email was sent.
- Complete mobile/tablet browser checks and keyboard-only checkout checks. No unsupported claim of mobile browser QA or accessibility certification is made.
- Measure Lighthouse on representative deployed pages under documented conditions. No Lighthouse or Core Web Vitals score has been measured; the 90 mobile target is not claimed as achieved.
- WebMCP enhancement is feature-detected and absent from unsupported browsers. This browser reported `modelContext` unavailable, so structured-tool execution could not be verified.
- Check every final product's commercial specifications, gallery mapping, inclusions and fulfilment terms against the approved schedule.
- Review the GitHub commit, pull request and CI results for the submitted branch. Complete Cloudflare deployment checks after the hosting connection is supplied. No live domain release has occurred.

The initial preview needed a fixed Astro host/port and Node prerendering for this environment. These settings are retained in source. Tests use `node --import tsx` to avoid the tsx CLI's unnecessary local IPC listener.
