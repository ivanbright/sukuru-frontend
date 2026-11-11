# Dispatch reference map for Sukuru

This map records what is present in the captured site and how it should inform Sukuru. It deliberately separates visual patterns from Dispatch-specific product content.

## Sources inspected

- Captured Framer pages: `dispatch.framer.website/index.html`, `contact.html`, `about.html`, `blog.html`, `changelog.html`, and `404.html`.
- Captured product-screen images: `OOLGXHSuKyfETWSRhoPx3T3L2Jo627b.png` (Connect), `yoCTSOxleoeINQPMrWNi0UJl4Dg627b.png` (Resolve), `Xg8VOxHHhtCfv6xPIMgjCcMo3lo627b.png` (Control), and `RZp0DCmjTg27KV8Q2X3oyjJJgK4627b.png` (Analyze).
- Source tokens and patterns: `tokens.css`, `patterns.css`, and `fonts.css` in this directory.
- The earlier editable dashboard prototype: `rebuild/dashboard/index.html` and `dashboard.css`.

## What the references actually do

### Product screens

- A charcoal application canvas (`#1d1d1d` / `#262626`) contains darker inset command bars (`#1d1d1d`) and work panels (`#2e2e2e`). The depth comes from nested surfaces and borders, not cream cards floating on a beige page.
- The top command bar uses a monospace route-like label (`dispatch://connect`, `dispatch://resolve`, `dispatch://control`, `dispatch://analyze`), then a small contextual action and a menu control.
- Each screen opens with a large, light-weight Geist heading. Muted uppercase labels establish hierarchy; IBM Plex Mono is reserved for route labels, IDs, status, and operational values.
- Tables use full-width rows, thin warm-gray rules, roomy but consistent row heights, and left/right alignment by data type. Statuses are compact rectangular color blocks. Green, cyan, amber, and magenta are semantic state colors in the captured product mockups; orange remains the brand accent.
- The mockups use square panels and sharp controls. A few source marketing CTAs use a pill, while the landing page hero also uses a clipped-corner slab. Those are separate variants; neither justifies rounding every application control.
- Analytics uses a wide insight area beside tall metric blocks. Resolve uses a work-in-progress checklist beside a compact activity table. Connect uses a table beside a sync detail panel. Control uses a rule table beside an approval panel. These are content-layout patterns to translate into sales, stock, reporting, and settings—not content to copy literally.

### Marketing and form pages

- The landing page uses a graphite field, warm cream display type, an orange brand tab, hairline divisions, and a restrained dotted field behind its geometric artwork.
- The orange Dispatch mark is a directional diamond. Sukuru should preserve its own name and use a related geometric treatment only if it remains clearly a Sukuru mark; the Dispatch wordmark must not replace the product identity.
- The contact form is a separate page composition with labeled inputs, grouped identity fields, and a high-contrast primary action. Its patterns inform Sukuru authentication; it is not an application dashboard template.
- The captured photographs, AI workflow diagram, compliance badges, and support-ticket mock data are page-specific assets. They should not be inserted into shop screens as decoration. The mark and subtle geometric/dot motif are the reusable visual cues.

### Typography, shape, and motion

- Captured families: Geist, IBM Plex Mono, Inter Variable, and LT Remark. The app should use the locally captured Geist and IBM Plex Mono for dependable rendering; an accent font is reserved for an intentional editorial moment, not routine dashboard text.
- Source palette: orange `#fa6c34` / `#ff7038`, ink `#1d1d1d`, charcoal `#2e2e2e`, panel `#242424`, paper `#e9e0d1`, sand `#d6ccba`, warm gray `#635d5a`. Use the exact captured tokens where they exist.
- Source motion repeatedly uses `transform` and `opacity` over `0.4s cubic-bezier(0.25, 0.1, 0.25, 1)`, with small staggered delays. The primary marketing CTA also cycles each character vertically on hover, staggered by about `0.014s`. Use that letter motion only for deliberate primary actions; do not rotate refresh icons or make every card bounce.
- Captured operational controls are predominantly sharp; use square corners on dashboard controls and panels. Keep the documented 678px pill radius scoped to the specific pill CTA variant.

### Additional page compositions observed in the supplied screenshots

- The site holds a strict central column grid between a narrow utility rail and a full-width top navigation. Thin rules continue across sections; section labels begin with a small marker and a long diagonal hatch, and many content blocks align exactly to those rules.
- Feature and numbers sections switch onto warm paper. Their panels meet edge-to-edge and use small chamfered corners, fine dividers, hatch-framed diagrams, and compact numeric indices. This is a separate editorial/marketing treatment; it should not turn every operational widget into a light card.
- The home hero is an asymmetric split: large lightweight display type and a broad clipped CTA on the left, a dotted technical illustration on the right, with a numbered accordion below. Product data panels should borrow its clear text/artwork division only when a real visual explains the business data.
- About and footer compositions combine large editorial statements, a restrained grayscale photo strip, structured page/social link columns, and one large orange brand field. Those photos and Dispatch wordmark remain page-specific assets, not default Sukuru decoration.
- The supplied contact form confirms a distinct warm-paper form surface with a clipped outer frame, diagonal hatch inset, carefully aligned field groups, and a dark CTA cut at opposing corners. The auth page now translates that pattern while retaining Sukuru’s own account fields and branding.
- The pricing reference includes a monthly/annual selector, a three-plan comparison and an emphasized middle column. The captured `Pricing_Number.js` module in `dispatch.framer.website (1).zip` confirms price changes count to the next value over 0.6 seconds with `easeOut`, rounding displayed updates to whole numbers. The archive does not reveal the toggle’s active-state transition; that motion must be inspected before implementing a matching billing selector.
- Across Sukuru navigation, use route-like monospace context (`sukuru://...`) and numbered section links to reflect the source’s command-bar labels and indexed side navigation. Keep each destination’s label explicit and readable.

## Sukuru translation

| Sukuru surface | Reference pattern to translate | Content must come from |
| --- | --- | --- |
| Overview | Analyze's insight/metric balance plus Resolve's action checklist and activity list | Existing report, stock, and sale APIs; label unavailable data rather than invent it |
| Sales | Resolve's active-work panel and ruled activity list | Actual sale/payment APIs; distinguish sale total from amount paid and balance |
| Inventory | Connect's table/detail split and compact status blocks | Actual stock records and movement APIs |
| Products | Connect's table rhythm, category grouping, and precise controls | Actual product/catalog APIs |
| Reports | Analyze's selected-period controls, useful insight panel, and large metric hierarchy | Existing report API; define revenue, profit, and period semantics |
| Business settings | Control's rule/detail split and clear sections | Existing business profile API; do not imply tax/RRA certification settings that do not exist |
| Sign in / registration | Contact page's labeled form hierarchy and primary-action treatment | Existing auth API and validated business setup fields |

## Known drift to correct

- Previous app styling made the workspace paper-colored, made the sidebar permanently occupy a large part of the canvas, rounded cards and buttons broadly, and introduced decorative status copy. That conflicts with the captured product-screen composition.
- `DISPATCH_DESIGN_SYSTEM_EXTRACTED.md` contains useful token values but also overgeneralizes the pill button and marketing layout. Older audit/action-plan documents contain blue/white guidance that conflicts with the captured source tokens and screen images; do not treat those passages as authoritative.
- The earlier dashboard prototype is useful as a layout and interaction reference, but its Dispatch ticket values and demo interactions are not Sukuru product requirements. Keep Sukuru wired to its own APIs.
