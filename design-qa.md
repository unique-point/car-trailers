# Design QA

## Comparison target

- Source visual truth path: https://kingkongtrailers.com.au/
- Implementation URL and screenshot path: cloud-browser capture of http://terminal.local:4173/
- Mobile implementation screenshot path: cloud-browser capture of a temporary 390 x 844 responsive frame. The temporary QA route was removed after capture.
- Desktop viewport: 1363 x 911 CSS pixels at device pixel ratio 1.
- Source pixels: 1363 x 911.
- Implementation pixels: 1363 x 911.
- Mobile content viewport: 390 x 844 CSS pixels at device pixel ratio 1.
- State: public home page, signed out, cart empty for the initial comparison. Cart count 1 in the post-interaction capture after the saved-selection test.
- Density normalization: source and implementation desktop captures used the same browser, CSS viewport and density. No resampling was needed.

## Full-view comparison evidence

The source and implementation desktop captures were emitted together in one browser comparison call. Both use a black utility bar, white primary header, brand-led navigation, a full-width announcement strip, split black/image hero and four quick-action panels. The implementation deliberately maps the source red accent system to the approved Car Trailers lime, black and white palette. Source promotions, phone numbers, branch details, reviews, prices and product claims were not copied because approved Car Trailers commercial data has not been supplied.

The implementation continues the source information hierarchy below the fold with circular category navigation, a featured product grid, company credibility panel, practical support section, bulk-order panel, step-based buying journey and expanded four-column footer.

## Focused region evidence

The desktop header and hero were readable in the full-view captures and were compared directly for hierarchy, navigation density, announcement treatment, logo scale, CTA placement and image crop. A separate focused mobile capture checked the utility bar, logo, menu control, horizontally scrolling announcement strip, hero typography, CTA wrapping and hero-image transition at 390 x 844.

## Required fidelity surfaces

- Fonts and typography: the source uses a heavy display face. The implementation uses system Arial/Helvetica with 700 to 750 weights, matching the dense industrial hierarchy without importing the source font. Heading scale, tight tracking, uppercase eyebrows and small utility text remain consistent. No clipping or unreadable wrapping was found.
- Spacing and layout rhythm: header height, announcement density, split-hero proportions, quick-action grid, section spacing and footer groupings follow the source structure. Desktop alignment is clean. Mobile sections collapse to one column and controls remain reachable.
- Colours and tokens: source red was intentionally replaced with the approved lime, black, charcoal and white Car Trailers system. Contrast is strong across hero, buttons and utility surfaces.
- Image quality and asset fidelity: the approved Car Trailers logo and original trailer/headquarters assets are used. No source images, hotlinks, custom SVG substitutes, emoji icons or CSS-drawn product art appear in the implementation.
- Copy and content: every visible brand reference uses Car Trailers Australia. Content is original and avoids unapproved prices, locations, warranty periods, ratings and promotions.
- Icons and controls: arrows, cart count, mobile menu, compare states, search, sort, gallery, quote, selection and checkout controls are present and aligned with their labels.
- Accessibility: semantic landmarks, labels, headings, focus outlines, reduced-motion handling, alternative text and keyboard-operable controls are present. Mobile tap targets meet the existing 44 to 48 pixel control sizing.

## Interaction evidence

- Catalogue search filtered the range to one enclosed trailer.
- Compare changed to the selected state.
- Product configuration saved an enclosed trailer to local selection.
- Cart displayed the saved product and correct quantity summary.
- Finance, locations, maintenance, manuals, bulk orders, dealer, guides, news and sitemap routes rendered with the expected page title and H1.
- All 18 automated commerce, stock, payment, webhook, security and order tests passed.
- Astro check completed with zero errors, zero warnings and zero hints.
- Production build completed successfully.
- Browser console was checked. No application-origin errors were found. Chrome extension metadata errors were excluded because they do not originate from the website.

## Comparison history

### Iteration 1

- P2: the first implementation capture lacked the source-style sitewide announcement strip above the hero.
- Fix: added a four-item Car Trailers range and enquiry strip using approved brand colours and original content.
- Post-fix evidence: desktop capture showed the strip between the header and hero with the intended five-column rhythm.

### Iteration 2

- P2: the announcement links stacked vertically in the first 390 x 844 capture because the general mobile navigation rule applied column direction.
- Fix: set the announcement strip to an explicit horizontal flex row with overflow scrolling at the mobile breakpoint.
- Post-fix evidence: the second 390 x 844 capture showed one compact horizontal strip, a clear mobile header and an unobstructed hero.

## Findings

No actionable P0, P1 or P2 design differences remain. Remaining differences are intentional brand and commercial-content substitutions.

## Follow-up polish

- P3: replace the system display font only if an approved Car Trailers brand font is supplied.
- P3: replace provisional concept labels when final photographed products and SKU information are approved.

final result: passed
