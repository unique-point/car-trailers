# Reference parity repair — 21 September 2026

## Why this repair was needed

The earlier implementation reproduced only part of the reference experience. It had a static split hero, four category links, a small featured grid, simple filters, a cart link and basic product information. Calling that a complete copy was inaccurate.

This pass inspected the live King Kong homepage, shop, car-transporter detail page, empty cart drawer and finance page. No enquiry, payment or order was submitted to the reference business. Its private backend is not observable and has not been copied. The source screenshot comparison used a 1363 × 936 browser viewport. Original copy, approved Car Trailers imagery and the Fox-inspired lime/yellow palette are retained.

## Implemented changes

| Reference pattern | This release |
| --- | --- |
| Utility header, dropdown navigation, service and cart controls | Expanded header with full range and support menus, mobile menu, shared cart drawer, dealer and collection links |
| Promotion band | Configurable promotional band with expiry countdowns; range highlights are used while there are no approved offers |
| Four-slide hero, dots and arrows | Four original slides, selected indicators, previous/next, pause/play, reduced-motion and keyboard-focus handling |
| Four quick actions | Shop, quotation, collection and finance pathways in matching positions |
| Category circles and expansion | Eight illustrated category entry points, an expandable complete category directory and 19 canonical category routes |
| Featured product tabs | Featured, box/cage, car transporters and trade/gardening panels with keyboard support |
| About, support, commercial and collection sections | Original content in corresponding homepage sections, configurable real-location panels and optional verified-review carousel |
| Filtered shop with category strip and sorting | Category/keyword/axle-layout/access filters, removable selections, sorting, result counts, empty state, pagination, price inputs/sliders and approved-specification facets |
| Product image gallery | Thumbnails, previous/next, image count, enlarged image dialog and keyboard navigation; optional genuine 3D-model embed field |
| Configuration and summary | Intended load, quantity and fulfilment, visible summary, commercial-enquiry prompt, approved option pricing, quote/cart handoff |
| Product information tabs | Overview, features, specifications, build/towing, options/inclusions, warranty/FAQ |
| Related-model comparison and build-detail selector | On-page four-design comparison, separate saved comparison and interactive design-detail panels |
| Cart drawer, cart and checkout | A single persisted selection shared by all three surfaces; edit quantities, remove items, quote/download selection; approved records continue to the existing Stripe integration |
| Service, business, dealer and contact pathways | Contextual enquiry forms with retained topic, real availability gate, optional draft download and no false sent confirmation |
| Finance and manuals | Original finance page, configurable application/calculator destinations, searchable approved manual catalogue and manual requests |
| Footer, jump links and assistance widget | Full footer, trade-range strip, page jump navigation and an assistance menu with working destinations |

## Limits requiring real business information or provider assets

- Only eight provisional design families are populated. Categories without supplied products explicitly say no products are published. They do not borrow King Kong SKUs or pretend to hold stock.
- Numeric specification filters, stock and prices need approved commercial records. No ratings are inferred from generated imagery.
- Real locations/hours/phone numbers, offers, manuals, customer reviews and finance links must be supplied and approved before appearing. The rendering components are in `src/data/storefront.ts` and corresponding components.
- A 3D viewer needs a genuine approved model URL. It is not a 3D reconstruction of an illustrative PNG.
- The assistance widget is a navigation/contact tool, not a claim that a live chat agent is connected. A live support provider remains a separate connection.
- Actual checkout depends on Stripe setup, approved prices/options, deposits, fulfilment and policies. The existing API recalculates prices and checks revisions, inventory and signatures. The review deployment keeps commerce disabled.
- Public enquiry delivery, notifications and indexing remain disabled. Forms show this before a visitor can submit and allow a draft download instead.
- Approved pickup locations and their fees can be selected per product. Inventory is shared by product; branch-level inventory and unconfirmed delivery remain quote-based. A complete replica of the competitor's private fulfilment system is not claimed.

## Validation

- Astro/TypeScript check: no errors, warnings or hints.
- Production Astro/Cloudflare build passes.
- 20 backend tests pass (pricing, deposits, inventory reservations, webhook replay/signatures, refunds, balances, enquiry gates and staff identity).
- Seven DOM interaction tests pass against the built pages: combined filters/reset, category scope/empty states, keyboard tabs/carousel, gallery-to-cart handoff, invalid saved rows/quantity synchronisation, closed enquiry gate/context, and approved pickup-fee selection.
- Initial desktop browser visual review verified the new header, promotion band, hero composition and quick actions. The supervised preview later lost its connection during a build; DOM regression tests were used before deployment, with live-domain browser checks after publishing.
- CI, deployment and live-browser evidence are recorded in [RELEASE-2026-09-21.md](RELEASE-2026-09-21.md).

## Source locations

`src/data/storefront.ts` controls public category structure and approved business collections. `src/components` contains the shared layouts. `src/lib/storefront-client.ts` implements the additional interactions. Existing commerce storage, security, payment and notification modules are preserved. `tests/storefront-dom.mjs` validates customer interactions using a synthetic DOM and no real provider calls.
