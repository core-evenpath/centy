## Navigation, Brand & SEO — Done

### Navigation
- 3 anchor links: Relay (#relay), How it works (#demo), Industries (#industries)
- Section IDs added/verified on all target sections
- Smooth scroll via `scroll-smooth` class on <html>
- `scroll-margin-top: 80px` to offset fixed nav
- Mobile hamburger nav (sm:hidden) with auto-close on scroll
- Footer links updated to match nav

### Brand Assets
- `public/images/brand/logo.svg` — full wordmark (P mark + "Pingbox")
- `public/images/brand/favicon.svg` — P mark only
- `public/images/brand/og-image.svg` (and .png)
- `public/favicon.svg` — copied from brand directory

### SEO (layout.tsx)
- Title: "Pingbox — AI That Responds to Your Customers in 30 Seconds"
- Description: channel-agnostic, mentions all 4 channels
- Keywords: 14 terms covering AI messaging, verticals, use cases
- OG image: points to new brand asset
- Favicon: SVG favicon linked
- siteName: "Pingbox" (not PingBox)

### UX / Accessibility
- <main> wrapper around page content
- aria-label on nav
- Single <h1> verified (hero only)
- prefers-reduced-motion media query kills all animations
- Mobile nav accessible: aria-expanded, aria-label on toggle

### Files modified
- `src/app/page.tsx` — nav links, section IDs, mobile nav, scroll-margin, reduced motion, semantic HTML
- `src/app/layout.tsx` — metadata, favicon, scroll-smooth

### Files created
- `public/images/brand/logo.svg`
- `public/images/brand/favicon.svg`
- `public/images/brand/og-image.svg`
- `public/images/brand/og-image.png`
- `public/favicon.svg`

### Honesty check
- [x] No design/layout changes
- [x] No typography changes
- [x] No new npm dependencies
- [x] Exactly 1 <h1> on page
- [x] All nav links have matching section IDs
- [x] PingBox → Pingbox everywhere
- [x] Mobile nav works and auto-closes
