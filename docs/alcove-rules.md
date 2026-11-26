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

## The margin: 25 px inside every edge

Every object, its whole surface and not only its centre, stays at least 25 px
(of 1920) inside each wall, the roof and the opening, as seen on the display.
This covers the calibration's 0.5–1 % spread and a player standing a pace off
the measured eye. Adrien picked it on the unit on 2026-11-25.

`alcoveInterior` turns those 25 px into distances in the box. It applies the
margin where it shows smallest on screen, which is the back of the box. Two
surfaces are exceptions:

- **The floor keeps no margin.** Things rest on it. What stands on the floor
  comes forward only to `floorFront`: the opening's floor edge is seen almost
  edge-on, so the same 25 px take about five times more depth there.
- **The roof holds its fixtures flush.** A part fixed to the roof (the claw's
  rails) has its top on the real roof (`SHIPPED_ALCOVE.height`), and keeps the
  margin across and in depth. Hung under the roof's inset instead, its far end
  dropped about 50 px below the back wall's top edge on screen and seemed to go
  through the wall (2026-11-26).

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

- The claw mocks draw the measured alcove's edges in red and the margin box in
  blue with `?grille`. Rails, the pile's sides and props meet the blue edges,
  except the roof fixtures, whose top meets the red roof.
- Look from the players' spot, in F11, then a pace left and right: nothing may
  cross a red edge.
- Before handing over a URL, open it in a portrait 9:16 window and in a
  landscape one. `.scene-canvas` must equal `innerWidth` × `innerHeight`, with
  nothing to scroll.
