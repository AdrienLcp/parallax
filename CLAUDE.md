# Parallax

Party games for the office's Looking Glass display (portrait touch screen):
phones join a room by QR code and act as controllers. `apps/game` is the web app
(display and phone), `apps/server` the Cloudflare Worker that serves it and
holds the rooms, `packages/protocol` the messages between them.

## Who runs the game

**The display simulates, the Durable Object relays.** `RoomObject` keeps the
room and its seats and forwards phone input (`sumo.stick`, `sumo.dash`, stamped
with the `seatId`) to the display, then the display's `sumo.state` to the
phones. Game rules and physics live in the game's feature
(`apps/game/src/features/games/sumo/`), never in the server. The host screens
(`features/screen/`) stay game-agnostic: a game hands them `SceneStandings`
already translated.

## Running it

- `corepack pnpm dev`: wrangler on `:8798` (about 30 s on first start) and Vite on
  `:5560`, which proxies `/api` and `/ws` to it. Restart Vite after adding a
  dependency.
- After any change to `apps/server/wrangler.jsonc`:
  `corepack pnpm --filter @parallax/server cf-typegen`. The server build runs
  `wrangler types --check` and fails otherwise.
- A background tab stops `requestAnimationFrame`, so a display left in one stops
  simulating. Give each real phone its own isolated browser context (separate
  localStorage = separate seat).

## Fake phones

A Node script stands in for players: one `WebSocket` per `sessionId`
(`/^[\w-]{16,64}$/`) on `ws://localhost:8798/ws/rooms/<CODE>`, sends
`hello` `{ protocolVersion: 1, credentials: { role: 'player', sessionId } }`,
`ping` every 4 s, `sumo.stick` every 50 ms at 0.45 magnitude (at 1 almost every
round ends in a draw), and a rare `sumo.dash`. A seat is never given back, so a
reused `sessionId` takes its old seat and a fresh room after many runs answers
`room_full`: put the process id in the `sessionId`, and clear
`parallax:screen-room` from localStorage to get a fresh room.

To drop a real controller's connection in Playwright, close only sockets whose
URL holds `/ws/rooms/`: Vite's HMR socket lives on the same page, and closing it
reloads the page, which hides the bug under test. `.seat-controller` never
counts as visible to Playwright: wait on it with `state: 'attached'`.

An absent seat is released after `SEAT_RELEASE_AFTER_MS` (60 s): the room's one
alarm rings for it, so a release test waits a full minute.

## Editing files

- Python scripts writing files on Windows open them with `newline=''`, or they
  write CRLF; Biome does not reformat Sass.
- cspell rejects unknown CSS words too: add real ones to `cspell.json`.

## Online

Every green push to `main` deploys the Worker to `https://parallax.adrienlcp.com`
(`docs/operations/`). **Private app:** it opts out of `conventions/seo.md` —
`noindex` on every response (meta robots and `apps/game/public/_headers`), no
sitemap, no share card.
