# SenpaiDen monetization readiness

## Implemented foundation

- [x] About page
- [x] Contact and role-based support addresses
- [x] Privacy policy
- [x] Terms of use
- [x] Copyright and takedown process
- [x] Footer access to trust pages
- [x] Sitemap entries for public trust pages
- [x] Email OTP verification flow
- [x] Responsive route-loading feedback and bounded catalogue requests
- [x] Cookie policy and persistent granular privacy choices
- [x] Optional analytics/advertising consent defaults to denied until a choice is made
- [x] Footer control for reopening and changing privacy choices
- [x] Consent-gated AdSense script loader with a global environment kill switch
- [x] Reusable ad-slot component with reserved space and visible advertisement labeling
- [x] Premium accounts suppress advertising inventory
- [x] Dynamic `ads.txt` route that stays inactive until a valid publisher ID exists
- [x] Partnership page and affiliate disclosure
- [x] Development, localhost and Premium traffic hard-suppressed from ads
- [x] Duplicate ad-slot initialization protection
- [x] OTP request and verification rate limits with `429`/`Retry-After`
- [x] Baseline security headers for application routes
- [x] Protected `/admin/monetization` release-status dashboard

## Owner actions required before applying

- [ ] Confirm `support@senpaiden.com`, `privacy@senpaiden.com`, `copyright@senpaiden.com`, and `partnerships@senpaiden.com` receive mail.
- [ ] Document licenses or permissions for every hosted manga chapter and image.
- [ ] Remove or restrict any title without a defensible distribution right.
- [ ] Add substantial original editorial content: reviews, guides, licensed-release news, creator coverage, and curated recommendations.
- [ ] Configure the Supabase email template to show `{{ .Token }}` and connect production SMTP.
- [ ] Publish the production domain over HTTPS and verify Search Console ownership.
- [ ] Connect a Google-certified CMP and map its regional TCF signals to the consent gates before personalized ads.
- [ ] Create an AdSense account only after the content/rights audit is complete.
- [ ] Add `ads.txt` only after a real publisher ID is issued.

## Content and rights audit fields

Track each title with: title, content owner, source, license/permission evidence, permitted territories, permitted formats, expiry, contact, review date, and action required.

## Proposed ad inventory (not implemented)

1. Home feed: one responsive unit after a meaningful content section.
2. Discover: one clearly labeled unit after a full row, never styled as a manga card.
3. Manga detail: one unit after metadata or below the chapter list.
4. Reader: only between chapter boundaries; never between panels or beside reader controls.

The reusable `AdSlot` is wired at the three proposed safe boundaries, but each placement has an independent environment flag defaulting to `false`. The reader is not a supported placement type.

### Placement approval switches

- `NEXT_PUBLIC_ADS_PLACEMENT_HOME=true` — after personalized recommendations, before Trending.
- `NEXT_PUBLIC_ADS_PLACEMENT_DISCOVER=true` — after the complete results grid, before pagination.
- `NEXT_PUBLIC_ADS_PLACEMENT_DETAIL=true` — after the manga detail experience.
- `NEXT_PUBLIC_ADS_PLACEMENT_LIBRARY=true` — after the saved-library content.
- `NEXT_PUBLIC_ADS_PLACEMENT_HISTORY=true` — after reading-history content or its empty state.
- `NEXT_PUBLIC_ADS_PLACEMENT_NOTIFICATIONS=true` — after the notification list, never inside a notification row.
- `NEXT_PUBLIC_ADS_PLACEMENT_DISCOVER_BOTTOM=true` — after pagination as a secondary Discover boundary.

All switches still require the global enable flag, a valid client/slot ID, advertising consent, and a non-Premium visitor.

Do not reward ad views/clicks with EXP, place ads near high-touch navigation, or ask readers to support the site by clicking ads.

## Release gates

1. Rights gate: no unverified hosted content in monetized inventory.
2. Trust gate: all published contact addresses work and policies match actual data handling.
3. UX gate: ads reserve space, avoid layout shift, and remain distinguishable from content.
4. Privacy gate: consent signals are applied before ad/analytics tags load where required.
5. Traffic gate: rate limiting and local/internal test exclusions are active; production traffic monitoring must be connected before launch.
