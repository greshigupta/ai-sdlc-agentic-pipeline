# snip-cli

Zero-dependency Node CLI for the Snip backend.

## Commands

- `snip add <url>`: create a short link and print `shortUrl`
- `snip ls`: list all links as `code / hits / url`
- `snip open <code>`: resolve code and open destination in your OS browser
- `snip help`: show usage

## Configuration

- `SNIP_API`: backend origin (default `http://localhost:3000`)

## Run locally

```bash
node cli.js help
./snip ls
```