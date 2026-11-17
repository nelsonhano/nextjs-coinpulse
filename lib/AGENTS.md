# CoinGecko Integration and Utilities

## Overview

Provides the server actions and utility functions for fetching cryptocurrency market data, OHLC candlestick series, token pools, and formatting currencies and timestamps.

## Key files

| File | Owns |
|---|---|
| `lib/coingecko.actions.ts` | Server actions for CoinGecko REST endpoints and pool searches |
| `lib/utils.ts` | Currency formatting, percentage calculations, relative time, and OHLC data sanitation |

## Conventions

- Always sanitize endpoint paths so that joining base URLs never introduces double slashes.
- Free tier uses header `x-cg-demo-api-key`, while Pro tier uses `x-cg-pro-api-key`.
- Return empty arrays or fallback objects rather than letting server action errors crash page loads.
- Normalize timestamps so that OHLC candles are strictly monotonic before sending to charts.

## Gotchas

- CoinGecko public demo API endpoints rate limit aggressively (HTTP 429). Server components must handle rate limits gracefully with fallback states.
- Lightweight charts crash if duplicate timestamps exist or if timestamps are not in strictly ascending order.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
