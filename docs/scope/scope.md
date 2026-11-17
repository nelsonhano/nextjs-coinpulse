# Scope: CoinPulse

Crypto screener application with a real time market analytics dashboard and currency terminal.

**Build approach:** Tracer Bullet (vertical slices, each feature built end to end through every layer, working).
**Workflow:** Beta (/check verify, then /test). The project default level of rigor. /architect is the recommended first stop for a feature with a real decision, but skippable when you already know the build. Any feature can carry its own tag to do more or less.

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use /develop and skip /architect. You decide when a feature is done._

## At a glance

| #   | Feature                                  | Phase      | Status   |
| --- | ---------------------------------------- | ---------- | -------- |
| 1   | Core Market Actions and Utilities        | Foundation | existing |
| 2   | Home Market Dashboard                    | Foundation | existing |
| 3   | Token Discovery Table and Pagination     | Foundation | existing |
| 4   | Token Details and Market Overview        | Foundation | existing |
| 5   | Currency Converter Widget                | Foundation | existing |
| 6   | Global Search Modal                      | Slice 1    | done     |
| 7   | Application Resilience and Quality Suite | Slice 1    | done     |
| 8   | WebSocket Live Streaming Resilience      | Slice 2    | done     |
| 9   | Token Watchlist and Saved Favorites      | Slice 2    | planned  |
| 10  | Enhanced Chart Interval Selectors        | Slice 2    | planned  |
| 11  | Mobile Navigation and Drawer             | Slice 2    | planned  |

## Foundations

### 1. Core Market Actions and Utilities · existing

Central data fetching layer with clean URL normalization, API key headers for free and pro tiers, and helpers for currency, percentages, and candlestick timestamps.
**Done when:** CoinGecko endpoints return validated JSON, paths contain no duplicate slashes, and format utilities handle null and NaN inputs safely.
Code in `lib/coingecko.actions.ts` and `lib/utils.ts`

### 2. Home Market Dashboard · existing

Primary landing page showing Bitcoin overview chart, trending cryptocurrencies table, and top category rankings with suspense loading skeletons.
**Done when:** users land on the root page and view market dominance, trending tokens, and categories without unhandled client or server exceptions.
Code in `app/page.tsx` and `components/home/`

### 3. Token Discovery Table and Pagination · existing

Paginated discovery catalog rendering prices, rank numbers, 24 hour percentage changes, and market capitalizations for the top tokens.
**Done when:** users can browse through paginated pages of coins, view trend colors, and click any row to visit its token page.
Code in `app/coins/page.tsx` and `components/CoinsPagination.tsx`

### 4. Token Details and Market Overview · existing

Detailed single coin screen presenting header statistics, interactive lightweight candlestick charts, recent trade streams, exchange listings, and verified external links.
**Done when:** visitors can examine any token, toggle chart timeframes, view recent trades, see exchange listings, and navigate external site links safely.
Code in `app/coins/[id]/page.tsx` and `components/LiveDataWrapper.tsx`

### 5. Currency Converter Widget · existing

Interactive exchange calculator converting token balances into various fiat and cryptocurrency rates.
**Done when:** users can type custom numeric token amounts and convert into supported currency choices without calculation errors.
Code in `components/Converter.tsx`

## Slice 1: Stabilization and Fixes

### 6. Global Search Modal · done

Global search dialog with debounced queries to CoinGecko search, keyboard shortcuts (Ctrl+K or Cmd+K, Escape), and direct token page routing.
**Done when:** pressing the search button or Ctrl+K opens the modal, searching queries CoinGecko, and clicking a token routes directly to its details page.

- [x] Design it (spec): `/architect global search modal`
- [x] Build it: `/develop global search modal`
- [x] Verify it: `/check verify global search modal`
- [x] Test it: `/test global search modal`
      Code in `components/SearchModal.tsx` and `components/Header.tsx`

### 7. Application Resilience and Quality Suite · done

Error boundaries, dedicated not found page, strictly monotonic candlestick data filtering, and automated unit tests.
**Done when:** unknown coin routes display a branded 404 page, API rate limits trigger friendly retry interfaces, and unit tests verify all core utilities.

- [x] Design it (spec): `/architect application resilience`
- [x] Build it: `/develop application resilience`
- [x] Verify it: `/check verify application resilience`
- [x] Test it: `/test application resilience`
      Code in `app/not-found.tsx`, `app/error.tsx`, and `tests/app.test.ts`

## Slice 2: Realtime Reliability and User Features

### 8. WebSocket Live Streaming Resilience · done

Exponential backoff, heartbeat reconnects, and graceful degradation for live price and trade feeds when connection drops or rate limits hit.
**Done when:** WebSocket automatically attempts reconnection on disconnect, handles reconnect backoff, and keeps UI updated without unhandled exceptions.

- [x] Build it: `/develop websocket live streaming resilience`
- [x] Verify it: `/check verify websocket live streaming resilience`
- [x] Test it: `/test websocket live streaming resilience`
      Code in `hooks/useCoinGeckoWebSocket.ts`, `components/CoinHeader.tsx`, and `components/LiveDataWrapper.tsx`

### 9. Token Watchlist and Saved Favorites · planned · needs a decision

Client side persistence for favoriting coins, allowing users to bookmark assets and filter their watchlist on the coins table.
**Done when:** users can click a star icon on any coin row or details header, and view their saved list across browser sessions.

- [ ] Design it (spec): `/architect token watchlist and saved favorites`

### 10. Enhanced Chart Interval Selectors · planned · needs a decision

Additional historical candlestick granularities, providing hourly intervals for short range intraday analysis.
**Done when:** users can switch between 1 hour, 4 hour, and daily candles, and the chart renders without scale distortion.

- [ ] Design it (spec): `/architect enhanced chart interval selectors`

### 11. Mobile Navigation and Drawer · planned

Mobile friendly drawer menu with quick search access, theme consistency, and responsive table scrolling for phones and tablets.
**Done when:** mobile screens show a clean hamburger or bottom bar navigation, allowing access to search, all coins, and token details without layout overflow.

- [ ] Build it: `/develop mobile navigation and drawer`

## Deferred

Out of scope for the current build pass, kept so the plan stays honest:

- Portfolio tracker with transaction logging and profit calculation · needs a decision
- Multi exchange arbitrage price comparator · needs a decision
- User authentication and cloud synchronized alerts · needs a decision · GA

## Legend

**The decision box.** Every feature carries exactly one, the sub task whose label ends with `(spec)`. Its wording varies (`Design it (spec)` normally), so skills locate it by that `(spec)` suffix, never by an exact label. Every other box is an execution box.

**Feature lifecycle**: the scope updates as a feature moves:

- `planned` · needs a decision: run `/architect <feature>` first.
- `in-progress`: designed or building, milestone sub boxes advance.
- `done`: completed and verified.
- `existing`: pre existing code enrolled for context.
- **Next step**: the first unticked box.
