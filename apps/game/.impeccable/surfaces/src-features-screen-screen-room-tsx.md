---
version: 1
slug: "src-features-screen-screen-room-tsx"
primary_target: "src/features/screen/screen-room.tsx"
related_targets: ["src/features/play/play-page.tsx","src/features/games/sumo/sumo-controller.tsx"]
---

# Surface brief — room shell and sumo controller

## Scope and mode

- **Display** (`/screen`): Experience. A standing group reads it from a few metres away; the game is the artifact.
- **Controller** (`/play/:code`): Operate. Used blind under the thumbs while the eyes stay on the display.

Audience, job and constraints live in `apps/game/PRODUCT.md`.

## Direction contract

THESIS: A bistrot table game seen from above. The display is a felt tabletop; the arena is a plan drawn in brass filets, not a modelled object. It refuses the category default of a neon arcade lobby with cards and glowing buttons.

OWN-WORLD: Billiard-green felt ground; brass filets (rings, ticks, rules) for every structure; lacquered tops in six seat colours, each carrying a carved glyph (circle, triangle, square, diamond, cross, hexagon); an enamel-blue plaque with an ivory inner filet for the room code; slate panels framed in walnut for the scoreboard; ivory QR. Big Shoulders Display (900, uppercase) for names and titles, Barlow Semi Condensed for the rest. No gradients, no glass, no cards.

STORY: A passer-by sees the felt table and the plaque, scans, and their phone turns their seat colour with their own top on it. They rotate the phone, push their top into the others, and watch someone go to the gutter.

FIRST VIEWPORT: Display, empty room: top quarter holds the ivory QR (23 % of the height) beside "Scannez pour jouer" and the KLMB plaque, with two pictogram cues under a brass rule; the felt arena fills the middle; the walnut-framed slate roster of six seats closes the bottom. Display in play: the round title and players left on the left of the header, the compact plaque and "Touchez pour jouer" on the right; a touch outside the controls opens the ivory QR card (12 cu) in the header corner for 20 s while the header's brass rule drains, at a constant header height; a press-and-hold "Jeux" in the roster foot leaves for the game choice. Controller in play, landscape: seat-coloured ground, the player's top and name centred at the top, a floating stick on the left half whose base is the arena plan in filets and whose knob is the player's own spinning top, and the "Foncer" disc on the right in the seat's text colour with a brass cooldown ring.

FORM: Plateau de bistrot, direction 2 of 3 (impeccable's pick over the rolled Munich 72 and the Detector challenger), arena reworked by Adrien into brass outlines on felt; controller chosen in landscape with two thumbs. seed:fa9ed36c9c0b4bfd

Signature interaction: the ejection — the slate band with brass filets wipes across the display ("Rouge à la rigole") and the same band wipes across the ejected player's phone ("À la rigole, par Vert").

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Reference mocks

- Display: `apps/game/.impeccable/mocks/directions/bistrot.html` (chosen decision comp, outlined arena).
- Controller: `apps/game/.impeccable/mocks/directions/manette-bistrot.html` (approved by Adrien on 2026-11-23).
- QR in play: `apps/game/.impeccable/mocks/session-b/qr-carte.html` ("La carte s'ouvre", chosen by Adrien on 2026-11-23 over `qr-bloc.html`).
- Waiting plan drawn through the scene's camera: `apps/game/.impeccable/mocks/session-b/plan.html`.

## Settled

- A seat is released 60 s after its phone leaves; a returning phone keeps its seat until someone else takes the slot.
- The QR shows only on touch during play, and stays large while the room waits.
- The sumo starts at 2 players.

## Unresolved

- Whether the 12 cu QR card scans from 2–3 m on the real display.
