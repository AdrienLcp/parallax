---
version: 1
slug: "src-features-games-tower-tower-scene-tsx"
primary_target: "src/features/games/tower/tower-scene.tsx"
related_targets: ["src/features/games/tower/tower-controller.tsx"]
---

# Surface brief — the tower's display

## Scope and mode

- **Display** (`/screen` while the tower is the room's game): Experience. A standing group reads it from a few metres away; the tower in the alcove is the artifact.
- The phone controller (stick across and in depth, a drop button) is shaped later in its own round.

Audience, job and constraints live in `apps/game/PRODUCT.md` ("The tower").

## Direction contract

THESIS: The alcove's back wall is a child's bedroom wall with its height chart, and the tower is measured against it like a growing child. It refuses the literal wooden-tower-on-a-table reading and the arcade score panel.

OWN-WORLD: Light backdrop, a pale bedroom green, so the real alcove shows and its floor and back wall catch the blocks' soft shadows. A yellow folding-rule height chart on the wall's left, black graduations, with pencil marks and handwritten names of the room's records. Varnished beech blocks (plank, cube, cylinder, arch, triangle) painted in the placing player's seat colour, the seat's glyph stamped on the front: the shared tower is a striped record of who placed what. Pencil graphite for lines and text, chart yellow for the room plaque and as the one accent. Fredoka for what is named, Kalam for what is pencilled (heights, records).

STORY: A passer-by sees the chart and the half-built striped tower, scans, sees their name come up on the wall with the next block, slides it across and in depth until its outline sits on the tower, and drops it; the pencil line climbs to the new height, or the tower falls and the wall names who did it.

FIRST VIEWPORT: Display in play: the back wall's top holds the rule ("Tour commune") over the current player's token and name, the compact yellow plaque beside the QR on the right, always shown since the display takes no touch; under a graphite rule, the next block's silhouette and the turn order. The chart stands on the wall's left half way up. The tower rises from the floor strip at the centre; the floating block hangs above it with its player's tag, its footprint outlined where it will land, its shadow straight under it; a pencil line with a handwritten height ("82 cm") marks the tower's top. Empty room: the join block (title, QR, plaque, two pictogram cues) over a tower that builds itself.

FORM: La toise, impeccable's pick (1 of 7 on the grounded list), chosen over the rolled "La maquette" and the competitive challenger "Le banc d'essai", in its light version. seed:bddda7954456a545

Signature interaction: the pencil line follows the tower's top at every block; when the round ends the record goes onto the chart with the name and the day.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Reference mocks

- `apps/game/.impeccable/mocks/tour/toise.html?clair` (chosen by Adrien on 2026-11-25), states with `?embed&clair&state=<shared|empty|race|fall|end>`; shared engine `engine.js`, shell `shell.js` / `shell.css`, world `toise.js`.

## Open decisions

- Splitting the host shell's tokens from the sumo's bistrot ones (DESIGN.md asks for it at the second game): proposed in `.handoff/tower.md`, waiting on Adrien.
- The light backdrop departs from DESIGN.md's lacquer ink: recorded in DESIGN.md by the documenter at finish, once checked on the unit.
- The chart's graduations sit on the back wall, so they do not line up with the tower's top in perspective; only the pencil line does.
