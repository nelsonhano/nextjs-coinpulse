# CoinPulse

## Stack

- **Language / Runtime**: TypeScript 5, Node 20+
- **Framework**: Next.js 16 (App Router, Turbopack), React 19
- **Key dependencies**: Tailwind CSS v4, TradingView Lightweight Charts, Radix UI, Lucide React
- **Package manager**: npm

## Build approach

Tracer Bullet (vertical slices, each feature built end to end through every layer, working).

## Commands

```bash
# Install dependencies
npm install

# Dev server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Run tests
npm test

# Linting
npm run lint

# Formatting
npm run format
```

## Specs

Stored in `docs/specs/`. Format: `docs/specs/NNNN-title.md`.

## Rules

- Server components are the default; mark client components with 'use client' at the top line.
- Use Next.js Server Actions in `lib/` for external API requests, keeping secrets on the server.
- CoinGecko timestamps are in milliseconds; lightweight charts require unix timestamps in seconds.
- Ensure candlestick series data is strictly ascending by timestamp before passing to charts.
- Handle CoinGecko free demo API key with `x-cg-demo-api-key` and pro with `x-cg-pro-api-key`.
- Keep environment variables typed and safely fall back when optional feeds like WebSockets are unset.
- Do not construct JSX trees directly inside try catch blocks in server components.

## Context files

- [lib/AGENTS.md](lib/AGENTS.md): CoinGecko API integration conventions and data transformations.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
