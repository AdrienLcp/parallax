---
version: 1
slug: "src-features-home-home-page-tsx"
primary_target: "src/features/home/home-page.tsx"
related_targets: ["src/features/games/sumo/sumo-showcase.tsx","src/features/home/game-tabs.tsx"]
---

# Surface brief — game choice (home)

## Scope and mode

- **Display** (`/`): Experience. The first thing a passer-by sees on the office display, read standing from a few metres; the game playing by itself is the artifact. Opened by whoever starts a session (a colleague, or the presenter in a demo).
- On a desktop or a phone, the same 9:16 column stands centred on the felt.

Audience, job and constraints live in `apps/game/PRODUCT.md`; the world lives in `apps/game/DESIGN.md`.

## Job

- Show what the game is before anyone reads: the real sumo scene, four bot-driven tops pushing each other into the gutter.
- Say how it plays in two pictogram cues, and how many can play.
- Offer one way in: the brass "Ouvrir la salle" button, or a touch on the showcase, both opening the room on `/screen`.
- Pick the game from enamel plaques once the app hosts more than one (`game-tabs`, hidden while only the sumo exists).

## Direction contract

THESIS: The shop window of a bistrot table: the game plays itself on the felt behind the glass, and the menu is the game. It refuses the category default of a lobby of game cards with cover art and "Play" buttons.

OWN-WORLD: Same felt, brass, chalk and lacquered tops as the room shell. The title in Big Shoulders Display (900, uppercase) at 15 cu over a brass rule; players count in Barlow Semi Condensed chalk-soft; the showcase is the game's own scene, not a picture of it; one solid brass button with a deep-brass edge. No cards, no cover art, no gradients.

STORY: A passer-by sees tops colliding on the felt and the word SUMO, reads "2 à 6 joueurs" and the two cues, and someone presses "Ouvrir la salle": the display turns into the room with its QR.

FIRST VIEWPORT: 540×960 column: SUMO top left with "2 à 6 joueurs" bottom-aligned on the right, over a brass rule (top ~18 %); the arena playing fills the middle; the two cues side by side, then the full-width brass button close the bottom. Game plaques sit above the title from two games on.

FORM: "L'arène en vitrine", chosen by Adrien on 2026-11-23 over "La carte" and "Les tables" (mocks in `.impeccable/mocks/session-b/`). seed:a8582301c6858d17

Signature interaction: the showcase is live, not a loop: bots push, a top drops into the gutter, the round restarts.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Reference mocks

- `apps/game/.impeccable/mocks/session-b/accueil-arene.html` (chosen), captures `.impeccable/review/session-b/accueil-arene*.png`.

## Unresolved

- What the plaques look like with a second game (the claw machine): `game-tabs` has never been seen rendered.
