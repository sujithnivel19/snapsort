# Snapsort

A mobile-first, swipe-based photo review tool for culling wedding/portrait shoots. Import photos from Google Drive or a local folder, let Snapsort group them by pose, then review one at a time with swipe gestures.

Built from a [Claude Design](https://claude.ai/design) handoff prototype (`Snapsort.dc.html`).

## Stack

- **Frontend**: React + Vite + TypeScript
- **Backend**: Express (`server/index.js`) — proxies pose classification to Claude vision so the API key stays server-side

## Features

- **Import**: local folder via the File System Access API, or Google Drive via Google Identity Services + Picker API
- **Automatic pose grouping**: photos are classified into Portrait — Solo / Couple — Close / Group — Family / Portrait — Candid using Claude vision (`claude-sonnet-5`)
- **Swipe review**: drag or use arrow keys to keep aside (reject) / favorite (keep) photos, with multi-step undo, card-stack transitions, and contact-sheet-style stamp animations
- **Summary**: kept vs. rejected counts per group

## Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable | Purpose | If unset |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude vision calls for pose classification (server-side) | Falls back to a deterministic mock grouping |
| `VITE_GOOGLE_CLIENT_ID` / `VITE_GOOGLE_API_KEY` | Google Drive OAuth + Picker | Drive import shows as "not configured"; use local folder instead |

## Run

```bash
npm run dev
```

Runs the Vite dev server and the classification backend together (`concurrently`). Vite proxies `/api` to the backend on port 8787.

## Build

```bash
npm run build
```
