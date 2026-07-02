# snip-backend

Tiny URL shortener backend implemented as a single-file Bun server with zero npm dependencies.

## Run

```bash
bun run server.js
```

or:

```bash
bun run start
```

Environment variables:

- `PORT` (default: `3000`)
- `BASE_URL` (used to build `shortUrl` values)
- `RAILWAY_PUBLIC_DOMAIN` (fallback for `BASE_URL` as `https://$RAILWAY_PUBLIC_DOMAIN`)
- `PUBLIC_DIR` (optional static file directory)

## API

- `POST /api/links` with body `{ "url": "https://example.com" }`
  - `201` with `{ code, url, shortUrl, hits, createdAt }`
  - `400` for invalid JSON or invalid non-http(s) URL
- `GET /api/links`
  - `200` with array of links in the same shape
- `GET /:code`
  - `302` redirects to original URL and increments `hits`
  - `404` for unknown code

If `PUBLIC_DIR` is set, static files are served and an existing static file path takes precedence over a short code.