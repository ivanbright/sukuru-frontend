# Sukuru business assistant frontend

Standalone Next.js frontend for the [Sukuru Spring Boot API](https://github.com/ivanbright/sukuru-backend). The app uses `http://localhost:8080` by default. Set `NEXT_PUBLIC_API_BASE_URL` to the API's base URL when running against another environment. The backend must allow the frontend origin through CORS.

## Search engine setup

The public sign-in page, `/features`, and `/guides` pages provide descriptive titles, summaries, canonical URLs, and Open Graph/Twitter metadata. The feature page has a semantic heading hierarchy, internal links, FAQ content, and SoftwareApplication structured data. Three `/guides/` articles provide original record-keeping advice and Article structured data. Authenticated workspace and onboarding routes are marked `noindex`. The generated `/sitemap.xml` lists only these public pages, and `/robots.txt` points crawlers to it.

Set these frontend hosting environment variables for production, then redeploy:

- `NEXT_PUBLIC_SITE_URL`: the public frontend origin, such as `https://www.example.com` (no trailing slash). Use the final custom domain, not the backend URL.
- `GOOGLE_SITE_VERIFICATION`: the token from Search Console's HTML-tag verification method, without the surrounding `<meta>` tag. Leave it blank until you receive the token.

After the frontend is deployed on its final HTTPS domain:

1. Add a **Domain** property in [Google Search Console](https://search.google.com/search-console/) and verify it by adding Google's DNS TXT record at your domain provider. This covers the root domain, subdomains, HTTP, and HTTPS. A URL-prefix property with HTML-tag verification is an alternative if you only need one exact origin; put the tag's `content` value in `GOOGLE_SITE_VERIFICATION` and redeploy before clicking Verify.
2. Check that `https://YOUR-DOMAIN/robots.txt` and `https://YOUR-DOMAIN/sitemap.xml` load publicly. The sitemap lists the sign-in page, public product overview, guide index, and three public guides; authenticated business screens are private application pages and should not be indexed.
3. In Search Console, submit `sitemap.xml` in the Sitemaps report. Use URL Inspection to check the public homepage and request indexing if it is eligible. Google decides independently whether and when to index pages.
4. Review the Page Indexing and Core Web Vitals reports over time. SEO metadata helps Google understand the site, but search visibility also needs useful public content such as a product overview, feature details, pricing information, and original help pages. The feature page is a start; expand it with original guides as customer questions and search queries become clear.

Keep `NEXT_PUBLIC_SITE_URL` empty in local development unless you are intentionally testing metadata for a specific public origin.

## Run locally

1. Clone and start the API and its PostgreSQL dependency using the [backend setup instructions](https://github.com/ivanbright/sukuru-backend#readme).
2. Install frontend dependencies with `npm ci`.
3. Copy `.env.example` to `.env.local` if you need to change the API URL.
4. Run `npm run dev` and open `http://localhost:3000`.
5. Sign in with a Sukuru account.

The app has separate overview, transactions, inventory, products, reports, business settings, and first-run onboarding routes. These screens share the workspace shell and design-system styles, and read from the existing API. New owner registration signs the owner in and opens a skippable shop setup flow: confirm business details, optionally create a first product, and optionally record opening stock. Sale entry creates a completed sale and its payment. Restock entry creates a draft purchase, receives it into inventory, and records its payment. Each authenticated POST uses an `Idempotency-Key` UUID, and retries reuse the same key to avoid duplicate records. JWT refresh tokens are rotated through the backend refresh endpoint when an access token expires.

This connected frontend focuses on the counter workflow and existing API contracts. It does not include AI or voice capture, and it does not fabricate sales, expense, or stock data when the API is unavailable.

API endpoints and contracts are documented in the [backend repository](https://github.com/ivanbright/sukuru-backend/blob/main/API_ENDPOINTS.md). Sukuru subscription billing is not implemented; operational sale and purchase payments are separate.

The shared design foundation is included in `design-system/` so the app builds from this repository root. Run `npm run lint` and `npm run build` before deploying. Configure `NEXT_PUBLIC_API_BASE_URL` in the frontend hosting environment and allow that deployed frontend origin in the backend CORS settings.
