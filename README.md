# Snip Monorepo Aggregator

This branch is an aggregator for one backend and two clients built from the same repository:

- backend: Bun URL shortener API
- frontend: Angular web client
- cli: Node command-line client

Each layer lives in its own branch and is mounted here as a submodule pointer.

## API contract

| Method | Path | Request body | Success response | Error response |
| --- | --- | --- | --- | --- |
| POST | /api/links | { "url": "https://..." } | 201 { code, url, shortUrl, hits, createdAt } | 400 for invalid JSON or non-http(s) URL |
| GET | /api/links | none | 200 array of link objects | 5xx on server issues |
| GET | /:code | none | 302 redirect to original URL, increments hits | 404 when code is unknown |

## Branch per layer and submodule layout

- backend submodule tracks branch backend
- frontend submodule tracks branch frontend
- cli submodule tracks branch cli

Layout:

- backend/
- frontend/
- cli/

## Clone instructions

Use recurse-submodules so folders are populated immediately.

git clone --recurse-submodules https://github.com/greshigupta/ai-sdlc-agentic-pipeline.git

If you already cloned without recurse-submodules:

git submodule update --init --recursive

## Run all pieces

Backend:

cd backend
bun run server.js

Frontend:

cd frontend
npm install
npm run start

CLI:

cd cli
node cli.js help
node cli.js add https://example.com
node cli.js ls

Default backend URL for clients is http://localhost:3000.

## Update workflow

1. Enter the submodule folder you want to change.
2. Commit and push from inside that submodule repository.
3. Return to the superproject root.
4. Update pointer to latest branch tip:

git submodule update --remote backend
git submodule update --remote frontend
git submodule update --remote cli

5. Stage pointer changes and commit in the superproject:

git add backend frontend cli
git commit -m "Bump submodule pointers"
git push
