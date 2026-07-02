# snip-backend

Tiny Bun URL shortener backend with no npm dependencies.

## Run

```bash
bun run server.js
```

or

```bash
bun run start
```

## API

- `POST /api/links` with JSON body `{ "url": "https://example.com" }`
  - `201` returns `{ code, url, shortUrl, hits, createdAt }`
  - `400` on invalid JSON or invalid/non-http(s) URL
- `GET /api/links`
  - `200` returns all links as an array
- `GET /:code`
  - `302` redirects to original URL and increments hits
  - `404` for unknown code

## Environment

- `PORT` (default `3000`)
- `BASE_URL` (used to build `shortUrl`)
  - fallback: `https://$RAILWAY_PUBLIC_DOMAIN` when set
  - fallback: `http://localhost:$PORT`
- `PUBLIC_DIR` (optional): serve static files from folder; `"/" -> index.html`
  - existing file path wins over same-named short code

## CORS

Open CORS is enabled for all routes with `OPTIONS` preflight support.
