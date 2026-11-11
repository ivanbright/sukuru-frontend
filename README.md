# Sukuru business assistant frontend

Standalone Next.js frontend for the [Sukuru Spring Boot API](https://github.com/ivanbright/sukuru-backend). The app uses `http://localhost:8080` by default. Set `NEXT_PUBLIC_API_BASE_URL` to the API's base URL when running against another environment. The backend must allow the frontend origin through CORS.

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
