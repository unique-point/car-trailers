# CAR TRAILERS AUSTRALIA

Astro 7 and TypeScript storefront with a Cloudflare Worker, D1 commerce storage and Stripe Checkout integration. Prepared for the existing repository https://github.com/unique-point/car-trailers and the requested domain https://www.car-trailers.com.au.

## Current release status

The review storefront is deployed through the existing Cloudflare Worker at https://www.car-trailers.com.au. The `publish-review-domain.yml` workflow publishes `main` using the existing GitHub environment credentials. GitHub and Cloudflare access do not need to be set up again.

The September 2026 reference-parity update adds a four-slide homepage, dropdown navigation, expanded category pages, filters, product detail tabs, model comparisons, shared cart drawer and contextual enquiry forms. See `docs/REFERENCE-PARITY-2026-09-21.md` for evidence and remaining dependencies.

The catalogue contains eight provisional design families with thirteen individual illustrations and the approved headquarters banner. Approved commercial data, provider connections and actual operating details are still needed before sales open. Commerce, enquiry delivery, notifications and indexing remain disabled in the review environment. The site does not copy the reference business's catalogue, prices, addresses, endorsements or commercial policies.

## Development

Use Node 24 and npm. `npm ci`, `npm run dev`, `npm run check`, `npm test`, and `npm run build` are the normal commands. After building, run `npm run test:ui` for storefront interaction regression tests. `npm run images` regenerates responsive WebP derivatives from the preserved PNG masters. Copy `.env.example` to `.dev.vars` for local settings. Never commit credentials or real customer data.

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

GitHub Actions validate the source on pushes and pull requests. Pushing verified changes to `main` triggers the existing review-domain deployment. Its release configuration includes the approved custom domain bindings. Preserve the existing deployment secrets and commercial launch gates.

## Managed UI preview

The supervised preview passes `--strictPort` to `scripts/dev.mjs`. This serves the validated `dist/client` build through Vite without trying to contact Cloudflare from the restricted preview runtime. Build first. It is a UI-only preview: real APIs are verified on the deployed Worker, and backend rules are covered by the separate commerce tests. Regular `npm run dev` continues to use Astro and Cloudflare bindings. Do not rebuild while capturing the UI preview; a rebuild replaces its asset directory.
