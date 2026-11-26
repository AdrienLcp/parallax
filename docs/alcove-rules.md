# Standing a game in the alcove

The rules every game's scene follows so it reads as standing inside the unit's
alcove, and how to check them. What the unit is and how the alcove was measured:
`display-hardware.md`.

## Use `features/alcove`, never its numbers

Every game in `apps/game` builds its scene from `apps/game/src/features/alcove/`:

| Piece              | What it gives                                                              |
| ------------------ | -------------------------------------------------------------------------- |
| `SHIPPED_ALCOVE`   | The measured box (1 wide, about 1.87 tall, 0.91 deep) and the players' eye |
| `aimAlcoveCamera`  | The camera at that eye, its view off-centre so the canvas is the display   |
| `alcoveInterior`   | The room every object stays in (below)                                     |
| `buildAlcoveStage` | An invisible floor and back wall that only catch shadows                   |

A game reads its sizes from these and copies no number out of them. Then one
change moves every game at once:

- a new calibration replaces `measured-alcove.ts`;
- a new margin changes `ALCOVE_MARGIN` in `alcove-bounds.ts`.

The tower goes through `features/alcove`; the sumo was being moved onto it on
2026-11-26, uncommitted. The claw mocks in
`apps/game/.impeccable/mocks/pince/` do not: `engine.js` keeps its own copy
(`ALCOVE`, `MARGIN_SCREEN`, `INNER`), updated by hand.

## The rule: nothing crosses the alcove's edges

The measured alcove is the limit: no object, its whole surface and not only its
centre, crosses a wall, the roof, the back wall or the opening, as seen from the
players' eye. Touching is allowed: a game that wants a part against a surface
(a pile on the floor, rails on the roof, a box against a wall) puts it there.
Adrien set this on 2026-11-26.

**Prefer floating.** A part pressed against a surface shows every error of the
calibration (0.5–1 % of the screen) and of a player standing a pace off the
measured eye. A scene that floats in the middle of the box, clear of every edge,
reads right from everywhere. New games are looked for that way.

`alcoveInterior` is the box for what must not touch: the alcove pulled in so
each edge shows 25 px (of 1920) on the display, the margin Adrien picked on the
unit on 2026-11-25. It applies the margin where it shows smallest on screen,
which is the back of the box. The floor keeps none, and what stands on it comes
forward only to `floorFront`: the opening's floor edge is seen almost edge-on,
so the same 25 px take about five times more depth there.

A part meant to touch a surface sits on the real one (`SHIPPED_ALCOVE`), not on
the inset: rails hung under the inset roof dropped their far ends about 50 px
below the back wall's top edge and seemed to go through it (2026-11-26).

## Why a part near the roof looks too deep

The scene is one flat image, seen from one eye at mid-height. A line on the roof
that sits lower draws lower on screen, and the viewer reads it as deeper: on a
flat image, lower and deeper give the same drawing. So a box inset under the
roof looks as if it reaches past the back wall, although it stops short of it.
The same goes for anything hung just under the roof. Near the roof, judge a part
by where its top touches, never by its inset outline.

## Nothing draws the alcove

- The backdrop is one solid, opaque colour. No floor, walls or roof are drawn:
  the optics show the real ones.
- Shadows fall on the floor and, softly, on the back wall, never on the side
  walls.
- Shadows soften with distance, like under a real lamp: a piece on the floor
  casts a crisp one, a lifted piece a wide, faint one. A renderer calls
  `enableSoftShadows` and passes each shadow-casting directional light through
  `softenShadow` (`features/alcove/alcove-soft-shadows.ts`). The tower does;
  the sumo is still on three's own soft shadows.

## Flat lettering

- The clock and the round are lettered flat on the back wall, behind the scene.
- The QR code and the room code stay in front of the scene, so no cable, claw or
  piece ever crosses them.
- The sound and game controls sit at the top.

## The page

The camera frames the box that holds the canvas. So a page meant for the unit
shows the canvas alone, filling the window, whatever shape the window has when
the page loads. A brief around a thumbnail goes behind a flag (`?brief` in the
claw mocks).

## Checking on the unit

- The claw mocks draw the measured alcove's edges in red and `alcoveInterior` in
  blue with `?grille`. Red is the rule; blue only shows where 25 px of margin
  would fall.
- Look from the players' spot, in F11, then a pace left and right: nothing may
  cross a red edge.
- Before handing over a URL, open it in a portrait 9:16 window and in a
  landscape one. `.scene-canvas` must equal `innerWidth` × `innerHeight`, with
  nothing to scroll.
