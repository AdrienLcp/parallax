# Parallax

Party games for the office's Looking Glass display (portrait screen, no touch):
phones join a room by QR code and act as controllers. `apps/game` is the web app
(display and phone), `apps/server` the Cloudflare Worker that serves it and
holds the rooms, `packages/protocol` the messages between them.

## Who runs the game

**The display simulates, the Durable Object relays.** `RoomObject` keeps the
room and its seats and forwards phone input (`sumo.stick`, `sumo.dash`, stamped
with the `seatId`) to the display, then the display's `sumo.state` to the
phones. The room also keeps its game and its phase (`lobby` or `playing`):
any seated phone or the screen changes the game in the lobby (`room.game`),
the screen reports `game.started` and `game.ended` (a match over or stopped:
every seat stays), and only the screen removes a seat (`seat.kick`); a phone
gives its own back with `seat.leave`. A screen that connects brings the room
back to its lobby, since a reloaded display lost its game. Game rules and physics live in the game's feature
(`apps/game/src/features/games/sumo/`), never in the server. The host screens
(`features/screen/`) stay game-agnostic: a game hands them `SceneStandings`
already translated.

Every game stands its scene in the measured alcove through `features/alcove/`:
`SHIPPED_ALCOVE` (the calibration solved as a box and an eye),
`aimAlcoveCamera` (the camera at the players' eye), `alcoveInterior` (the
box 25 px inside each edge, for what must not touch) and `buildAlcoveStage` (invisible floor and back wall that only catch
shadows). A new calibration replaces `measured-alcove.ts` and moves every game
at once. Nothing crosses the alcove's edges; touching them is allowed, floating
clear of them is preferred. The rest (flat lettering, checks on the unit):
`docs/alcove-rules.md`.

## Running it

- `corepack pnpm dev`: wrangler on `:8798` (about 30 s on first start, with an empty assets folder so a `vite build` does not reload it and drop the rooms; `:8798/` answers 404) and Vite on
  `:5560`, which proxies `/api` and `/ws` to it. Restart Vite after adding a
  dependency.
- The design mocks' servers (`design-mocks-*` in `.claude/launch.json`,
  `python -m http.server`) send no cache headers, so Adrien's browser keeps
  the old CSS and JS: bump a `?v=` on the page's stylesheet and module import
  after each change.
- After any change to `apps/server/wrangler.jsonc`:
  `corepack pnpm --filter @parallax/server cf-typegen`. The server build runs
  `wrangler types --check` and fails otherwise.
- A page for the unit fills the whole F11 window: the camera frames the box
  that holds the canvas, so a canvas in a thumbnail, a padded page or a page
  that scrolls stands the scene off the alcove. Such a page shows the canvas
  alone by default, never depending on the window's shape at load: the unit's
  page often loads before F11 or on another monitor, and stays as it loaded
  (a brief around a thumbnail goes behind a flag, `?brief` in the claw mocks).
  Before handing Adrien a URL, open that exact URL in a portrait 9:16 window
  and in a landscape one, and check `.scene-canvas` equals `innerWidth` ×
  `innerHeight` with nothing to scroll.
- A background tab stops `requestAnimationFrame`, so a display left in one stops
  simulating. Give each real phone its own isolated browser context (separate
  localStorage = separate seat).

## Fake phones

A Node script stands in for players: one `WebSocket` per `sessionId`
(`/^[\w-]{16,64}$/`) on `ws://127.0.0.1:8798/ws/rooms/<CODE>` (wrangler listens on IPv4 only), sends
`hello` `{ protocolVersion: 5, credentials: { role: 'player', sessionId } }`,
then `seat.ready` `{ name: null }` (a match starts once every present seat is
ready, and each match spends the marks: ready again for the next one), `ping`
every 4 s, `sumo.stick` every 50 ms at 0.45 magnitude (at 1 almost every
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

- Several sessions share this checkout and leave work in it, sometimes
  staged: commit with `git commit -- <paths>`, never a bare `git commit`.
- Python scripts writing files on Windows open them with `newline=''`, or they
  write CRLF; Biome does not reformat Sass.
- cspell rejects unknown CSS words too: add real ones to `cspell.json`.
- The stylesheet audit (`@adrienlcp/styles/audit`) judges a declaration by its
  property name only: a `px` value passes only in a property named `--radius*`,
  `--shadow*`, `--stroke*`, `--outline*`, `--target*` or `*-px`, and a literal
  `font-size` fails (go through a `--text-*` property).

## Online

Every green push to `main` deploys the Worker to `https://parallax.adrienlcp.com`
(`docs/operations/`). **Private app:** it opts out of `conventions/seo.md` —
`noindex` on every response (meta robots and `apps/game/public/_headers`), no
sitemap, no share card.
