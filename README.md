# Sukuru

[Open the live Sukuru app](https://sukuru.cursorclick.dev)

**A simpler way to keep track of your shop.** Sukuru is a small-business management app by [CursorClick](https://cursorclick.dev), for products, stock, sales, purchases, and reports.

This repository contains the Next.js frontend. It connects to the [Sukuru API](https://github.com/ivanbright/sukuru-backend).

## Run locally

Start the API first, then from this directory:

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app uses `http://localhost:8080` for the API by default. To use another API, set `NEXT_PUBLIC_API_BASE_URL` in `.env.local`. The API must allow the frontend origin through CORS.

## Build

```bash
npm run lint
npm run build
```

## Deploy and search

Set `NEXT_PUBLIC_API_BASE_URL` to your deployed API and allow this site's origin in the API's CORS settings. Set `NEXT_PUBLIC_SITE_URL` to the public HTTPS site URL for canonical links and sitemap metadata. If you use Google Search Console's HTML verification, set `GOOGLE_SITE_VERIFICATION` to its token.

The public pages are listed in `/sitemap.xml`; `/robots.txt` points search engines to the sitemap. Submit the sitemap in [Google Search Console](https://search.google.com/search-console/) after the site is live. Indexing and search placement are determined by Google.

## More

The backend repository documents the API in [`API_ENDPOINTS.md`](https://github.com/ivanbright/sukuru-backend/blob/main/API_ENDPOINTS.md). For help, visit [CursorClick](https://cursorclick.dev).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` - verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

Contact Ivan Bright: [WhatsApp](https://wa.me/250735024932), [mugishaivanbright250@gmail.com](mailto:mugishaivanbright250@gmail.com), or [support@cursorclick.dev](mailto:support@cursorclick.dev).
