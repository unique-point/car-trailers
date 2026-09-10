# CAR TRAILERS AUSTRALIA

Astro 7 and TypeScript storefront with a Cloudflare Worker, D1 commerce storage and Stripe Checkout integration. Prepared for the existing repository https://github.com/unique-point/car-trailers and the requested domain https://www.car-trailers.com.au.

## Current release status

This is a tested pre-launch implementation for the existing GitHub repository. Organisation access is confirmed and the source is being submitted on a review branch. It has not been deployed to the owner's Cloudflare account. The storefront uses eight provisional design families and thirteen separate trailer illustrations plus the approved headquarters banner. These are enquiry designs, not confirmed saleable SKUs.

Online selling, public enquiry capture, outgoing notifications and indexing are disabled by default. There are no invented commercial prices, ratings, stock levels, address, warranty periods or deposit policies in the public catalogue. The test suite uses explicitly labelled synthetic fixtures and a mocked Stripe HTTP service. It does not establish that the owner's Stripe account or Cloudflare deployment works.

## Development

Use Node 24 and npm. `npm ci`, `npm run dev`, `npm run check`, `npm test`, and `npm run build` are the normal commands. `npm run images` regenerates responsive WebP derivatives from the preserved PNG masters. Copy `.env.example` to `.dev.vars` for local settings. Never commit credentials or real customer data.

The Astro Cloudflare adapter uses Node to prerender static pages, and Workers for live endpoints. This avoids making static builds dependent on a running local Workers service. The finished Worker and static assets are under `dist/server` and `dist/client`. Wrangler receives the generated deployment configuration automatically.

Apply D1 migrations to a disposable local database with `npm run db:local`. Use separate D1 databases and Stripe keys for preview and production. The placeholder database ID deliberately prevents an accidental release.

## Main journeys

- `/`: brand homepage and approved concept headquarters.
- `/shop/`: category filters, keyword search, sorting and empty states.
- `/trailers/[slug]/`: individual images, alternate concept views, configuration and saved selections.
- `/compare/`: up to four trailer designs side by side.
- `/gardening/`: equipment and gardening showpiece.
- `/cart/`, `/quote/`: saved requirements, quantities, quotation handoff and durable enquiry endpoint.
- `/checkout/`, `/order/`, `/payment-cancelled/`: purchase review, Stripe redirect and cookie-protected status. Purchase controls appear only for an enabled, approved D1 commercial record.
- `/admin/`: Cloudflare Access-protected order/enquiry progress, commercial configuration, exports, audit records, balance links and manager refunds.
- `/about/`, `/contact/`, `/delivery/`, `/support/`, `/faq/`, `/privacy/`, `/terms/`, `/returns/`: original information templates; business terms still require completion before launch.

## Release documents

- `docs/HANDOVER.md`: deployment, operations and remaining business decisions.
- `docs/FEATURE-MAP.md`: what was observed, implemented and remains gated.
- `docs/ASSETS.md` and `docs/asset-manifest.json`: asset provenance and provisional grouping.
- `docs/VALIDATION.md`: actual verification and limitations.
- `docs/DESIGN.md`: visual system and responsive decisions.

GitHub Actions validate the source on pushes and pull requests. Deployment is an explicit workflow against a named GitHub environment with the real Cloudflare configuration. It does not change DNS automatically. Review and preserve existing Pages/Workers resources before linking the production hostname.
