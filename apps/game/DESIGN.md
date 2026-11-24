---
name: Parallax
description: A bistrot table game seen from above, played on a portrait display with phones as controllers.
colors:
  felt: "oklch(31.7% 0.051 162.2)"
  felt-deep: "oklch(26.3% 0.041 163.2)"
  brass: "oklch(73.1% 0.115 85.2)"
  brass-deep: "oklch(54.3% 0.095 83.4)"
  enamel: "oklch(37.6% 0.105 261)"
  walnut: "oklch(38% 0.058 56.8)"
  slate: "oklch(28.3% 0.008 169.8)"
  slate-line: "oklch(42.7% 0.011 160.9)"
  chalk: "oklch(93.1% 0.015 90.2)"
  chalk-soft: "oklch(79.2% 0.015 124.6)"
  ivory: "oklch(94.4% 0.023 87.2)"
  lacquer-ink: "oklch(20.8% 0.009 59.2)"
  seat-red: "oklch(56.6% 0.175 31.9)"
  seat-ivory: "oklch(91.8% 0.032 87.3)"
  seat-black: "oklch(24.7% 0.01 67.4)"
  seat-ochre: "oklch(72.4% 0.138 78.8)"
  seat-blue: "oklch(45.9% 0.094 251.4)"
  seat-green: "oklch(72.1% 0.107 131.3)"
  ground: "light-dark(oklch(100% 0 0), oklch(0% 0 0))"
  ink: "light-dark(oklch(20% 0 0), oklch(95% 0 0))"
  ink-muted: "light-dark(oklch(45% 0 0), oklch(72% 0 0))"
  rule: "light-dark(oklch(85% 0 0), oklch(30% 0 0))"
  rule-strong: "light-dark(oklch(60% 0 0), oklch(55% 0 0))"
  selection: "light-dark(oklch(88% 0.06 85), oklch(44% 0.08 84))"
typography:
  display:
    fontFamily: "'Big Shoulders Display', 'Big Shoulders Display fallback', sans-serif"
    fontSize: "4.875rem"
    fontWeight: 900
    lineHeight: 0.9
    letterSpacing: "0.02em"
  headline:
    fontFamily: "'Big Shoulders Display', 'Big Shoulders Display fallback', sans-serif"
    fontSize: "4rem"
    fontWeight: 900
    lineHeight: 0.9
    letterSpacing: "0.02em"
  plaque:
    fontFamily: "'Big Shoulders Display', 'Big Shoulders Display fallback', sans-serif"
    fontSize: "3.625rem"
    fontWeight: 900
    lineHeight: 0.9
    letterSpacing: "0.14em"
  title:
    fontFamily: "'Big Shoulders Display', 'Big Shoulders Display fallback', sans-serif"
    fontSize: "2rem"
    fontWeight: 900
    lineHeight: 0.9
    letterSpacing: "0.02em"
  body:
    fontFamily: "'Barlow Semi Condensed', 'Barlow Semi Condensed fallback', sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.6
  label:
    fontFamily: "'Barlow Semi Condensed', 'Barlow Semi Condensed fallback', sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.4
  small:
    fontFamily: "'Barlow Semi Condensed', 'Barlow Semi Condensed fallback', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
rounded:
  control: "4px"
  bubble: "6px"
  plaque: "12px"
  pill: "999px"
spacing:
  xs: "0.5rem"
  s: "0.75rem"
  m: "1rem"
  l: "1.5rem"
  2xl: "3rem"
components:
  room-plaque:
    backgroundColor: "{colors.enamel}"
    textColor: "{colors.ivory}"
    typography: "{typography.plaque}"
    rounded: "{rounded.plaque}"
    padding: "0.5rem 1.5rem"
  brass-button:
    backgroundColor: "{colors.brass}"
    textColor: "{colors.lacquer-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 3rem"
  game-tab:
    backgroundColor: "{colors.enamel}"
    textColor: "{colors.ivory}"
  game-tab-unselected:
    textColor: "{colors.chalk-soft}"
  back-to-games:
    textColor: "{colors.chalk-soft}"
  dash-button:
    rounded: "{rounded.pill}"
  lobby-ready:
    typography: "{typography.display}"
    rounded: "{rounded.control}"
    height: "5.5rem"
  lobby-ready-pressed:
    backgroundColor: "transparent"
  seat-roster:
    backgroundColor: "{colors.slate}"
    textColor: "{colors.chalk}"
  announcement-band:
    backgroundColor: "{colors.slate}"
    textColor: "{colors.chalk}"
  score-pip:
    rounded: "{rounded.pill}"
  score-pip-won:
    backgroundColor: "{colors.brass}"
    rounded: "{rounded.pill}"
  sumo-band:
    backgroundColor: "{colors.slate}"
    textColor: "{colors.chalk}"
    typography: "{typography.headline}"
    padding: "1rem 0"
  sumo-band-won:
    backgroundColor: "{colors.brass}"
    textColor: "{colors.lacquer-ink}"
  reconnecting-bubble:
    backgroundColor: "{colors.slate}"
    textColor: "{colors.chalk}"
    typography: "{typography.label}"
    rounded: "{rounded.bubble}"
    padding: "1rem 1.5rem"
---

# Design System: Parallax

## Overview

**Creative North Star: "Plateau de bistrot"**

A table game seen from directly above. The display is a billiard-green felt tabletop; every structure on it (arena rim, gutter edge, ticks, rules between zones, tally pips, cooldown gauge) is a brass filet drawn on that felt, never a modelled object. The objects that sit on the table are the furniture of a café: lacquered spinning tops in six seat colours, an enamel-blue plaque for the room code, an ivory QR card, a slate scoreboard framed in walnut. The phone is the same table seen through one seat: its whole ground turns that seat's lacquer and carries the player's own top.

In play, the display's arena is a real-time 3D scene seen through one perspective camera that leans 14° from straight above toward the people standing in front. The table itself stays a plan: unlit felt and brass filets. Before the scene loads, an SVG preview draws the same filets through the same camera (field of view, tilt, framing margin), so the scene lands on it without a jump. Only the tops are modelled: lacquered, clearcoated, ringed in brass, spinning on their point and casting soft ink shadows; a top that loses tips over and sinks into the gutter. The shell around the arena stays neutral: the game hands it a title, a subtitle, a cue, each seat's standing and the announcement of the moment, and the shell draws them in the bistrot vocabulary. For the game choice it hands three more pieces (`GameDefinition`'s `Preview`, `Showcase` and `Cues`): the arena before its scene loads, the game playing by itself, and its pictogram cues.

The display is read from a few metres away by a standing group and is never scrolled, so it is sized on one unit (`--cu`, 1 % of the portrait panel's height, capped by its 9:16 width) and holds a 3 % safe area that never touches the alcove's walls. The phone is used blind under two thumbs, so in play it carries only the player's top and name, a stick and one button; before a match it carries the name the room will call the player and one ready toggle. Density is low on both: few objects, very large uppercase lettering, no explanatory text beyond pictogram cues (the game's two on the join block and the game choice, one tap cue in play).

The bistrot look is fixed whatever the system theme. The home is the game choice and stands on the display like a room: same `--cu` column, same felt. While it is shown, `:root:has(.home-page)` maps the neutral tokens onto the bistrot ones (`ground` felt, `ink` chalk, `ink-muted` soft chalk, `rule` brass at 40 %, `rule-strong` brass-deep, focus brass), so the site footer below the column sits on felt too. Only the legal page and its footer follow light or dark through the neutral `ground` / `ink` tokens. Today the bistrot tokens sit at `:root` and are shared by the room shell (QR, plaque, roster) and the sumo; the product principle is that each game brings its own world while the host stays neutral, so a second game is the moment to split them.

**Key Characteristics:**
- Felt ground, brass filets for every line and ring, no gradients, no glass.
- Six lacquered tops, each with a carved glyph, so seats differ by shape as well as colour; flat SVG on every 2D surface, modelled only inside the 3D arena.
- The 3D arena is a flat plan with modelled tops on it, framed by a near-vertical camera; every colour it draws comes from the CSS tokens.
- Big Shoulders Display Black, uppercase, for everything named; Barlow Semi Condensed for everything read.
- Depth from soft ink-tinted shadows and inset double filets, never from blur or glow.
- Display sized in `--cu` units inside a 3 % safe area, the game choice included; controller sized in rem and `--pad-unit`.

## Colors

A dark felt-and-brass table with café objects in enamel, walnut, slate and ivory, and six lacquers that are the only saturated colours on screen.

### Primary

- **Billiard Felt** (felt): the ground of the display page and of every phone screen that is not inside a seat (notices, connecting). The arena's platform is felt lifted 6 % toward chalk.
- **Deep Felt** (felt-deep): the gutter ring around the arena, the place a top falls into.

### Secondary

- **Brass** (brass): every filet (arena rim at full strength, gutter edge at 55 %, centre ring at 40 %, ticks at 70 %), the rule under the join block, the rule under the game name on the game choice, the roster's empty-seat sockets, the dash cooldown ring, the rule under the play header (25 % while the QR is open, with a full-strength bar draining along it), the play header's tap pictogram, the ring that fills while "Games" is held, the bands' top and bottom borders, the tally pips, the line through a fallen seat's name, the ring around the match winner's place, the primary action fill ("Open the room", the notice action), and the focus ring on bistrot surfaces. Also the ring around each top on the display (`--seat-top-ring`), flat or modelled.
- **Deep Brass** (brass-deep): the inner filet inset in a brass button, and the focus colour on the neutral light theme.

### Tertiary

- **Enamel Blue** (enamel): the room-code plaque, with an ivory inner filet, and the chosen game's plaque on the game choice.
- **Walnut** (walnut): the frame around the slate roster, doubled by a darker walnut/ink filet.

### Neutral

- **Slate** (slate): the roster panel, the display's announcement band, the phone's outcome band, the reconnecting chip and bubble.
- **Slate Line** (slate-line): the rule under each roster seat, and the track of the "Games" hold ring.
- **Chalk** (chalk): all text written on felt or slate.
- **Soft Chalk** (chalk-soft): secondary text (free seat, absent player, band detail, the play header's subtitle, the player count on the game choice, an unchosen game's plaque, the resting "Games" control).
- **Ivory** (ivory): the QR card's quiet zone, the plaque lettering and filet (45 % for an unchosen game's outline), the cap of dark tops.
- **Lacquer Ink** (lacquer-ink): QR modules, text on brass, the cap of light tops, and the tint of every shadow, including the 3D scene's shadow catcher.
- **Host neutrals** (ground, ink, ink-muted, rule, rule-strong, selection): the legal page and the footer, following the system theme; remapped onto felt, chalk and brass while the game choice is shown.

### Seat lacquers

Six seats, by slot 0 to 5: **Red** (seat-red), **Ivory** (seat-ivory), **Black** (seat-black), **Ochre** (seat-ochre), **Blue** (seat-blue), **Green** (seat-green). An element with `data-seat-slot` hands its subtree three roles: `--seat` (the lacquer), `--seat-cap` (ivory on dark lacquers, lacquer-ink on light ones; the text colour on that seat) and `--seat-mark` (the glyph carved in the cap, the opposite of the cap). Glyphs by slot: circle, triangle, square, diamond, cross, hexagon.

### Named Rules

**The Filet Rule.** Structure is drawn, not filled: a ring, a rule, a tick or a gauge is a brass stroke on felt or slate, with opacity carrying its rank. No filled shapes stand in for lines.

**The Lacquer Rule.** The six seat lacquers are the only saturated colours, and they appear only as a seat: a top, a phone ground, a named seat. A seat colour never decorates anything that is not a player.

**The Two Marks Rule.** A seat is always shown by its top (lacquer plus carved glyph) and its name together, never by colour alone. The name is the one the player picked on their phone (12 characters at most), or the seat's colour until they pick one. In the arena, the modelled top carries a name tag hung above it. The game choice's demo tops are nobody's seat, so they go unnamed.

**The One Source Rule.** The 3D scene owns no colour. It resolves every token (`--felt`, `--brass`, `--seat`, `--seat-cap`, `--seat-mark`, `--seat-top-ring`, `color-mix` included) through a hidden probe in the page and draws without tone mapping, so the lacquer on the table is the lacquer in the roster.

## Typography

**Display Font:** Big Shoulders Display, weight 900 only (with a size-adjusted Arial fallback)
**Body Font:** Barlow Semi Condensed, 500 and 700 (with a size-adjusted Arial fallback)

**Character:** A heavy condensed poster capital, like a café menu board or a scoreboard, against a narrow, sturdy grotesque that stays legible at a glance. Both are self-hosted woff2 (latin and latin-ext), the three latin files preloaded.

### Hierarchy

- **Display** (900, uppercase, 0.9 line-height, 0.02em tracking, balanced): every name, title, room code and button label. Sized by the caller: on the phone the lobby name field (4.875rem, shrinking to fit a long name), the band title (4rem), the plaque (3.625rem), the notice headline, rotate cue and ready button (2.875rem), the seat badge (2rem), the dash label (1.375rem). On the display, in `--cu`: countdown (16), game name on the game choice (15), play title (8), plaque (6.4, compact 2.6), announcement (5.5), join heading, notice and "Open the room" (5.4), game plaque (3.4), roster name (3.2, shrinking to fit its column for a long name), top tag (2.2).
- **Plaque** (display voice, 0.14em tracking): the four-letter room code only, its trailing tracking removed from the end padding.
- **Label** (700, 1.4 line-height): cues, statuses, the free / absent seat text, band detail. 1.25rem on the phone; 1.7 to 2.6 `--cu` on the display (absence 1.7, cues and the roster's ready mark 1.9, subtitle, roster cue, tap cue and "Games" 2.2, free seat 2.4, player count 2.6).
- **Body** (500, 1rem, 1.6 line-height, `text-wrap: pretty`): running text on the host's secondary pages.
- **Small** (500, 0.875rem, 1.5 line-height): footer and notes on the host pages.

### Named Rules

**The Two Weights Rule.** The body face ships 500 and 700 only; anything heavier than regular is written 700, and font synthesis is off.

**The Names Are Capitals Rule.** What a player must read from across the room (a name, the code, an outcome) is in the display voice; everything else is a label in the body face.

## Layout

The display is a fixed portrait column, `56.25cu × 100cu` (9:16), centred on felt, with a block safe area of 1.7cu and an inline one of 1.6875cu. Both come from `presentation/styles/_display.sass`: `units` sets `--cu`, the safe area and the raised shadow on the page, `column` sizes the column; the room and the game choice include them. Three rows: the header on top, the arena filling the middle, the roster at a fixed 22cu at the bottom. The header is one grid cell holding two layers. The first is the join block while the room waits (ivory QR at 23cu wide beside the heading and plaque, two pictogram cues under a brass rule) and the play header while a game runs (title and subtitle on the left; on the right the compact plaque over a tap cue, or the QR card once the display is touched; a 0.2cu brass rule beneath; its height never changes). The second is the announcement band, which covers the header and bleeds through the inline safe area to the panel's edges; it never covers the arena. The arena row holds the 3D canvas (transparent around the gutter, so the page's felt is the backdrop) with the countdown centred over it. The roster is a 3 × 2 grid of seats, each a top beside its name over a slate-line rule, closed by a footer row: the cue on the left, "Games" on the right.

The game choice uses the same column in three rows: the head (game plaques, once there is more than one game, over the game name in 15cu with its player count bottom-aligned beside it, on a 0.2cu brass rule), the game playing by itself filling the middle (a touch on it opens the room), and the foot (the game's two pictogram cues over a 10cu-tall brass "Open the room" button spanning the column). The site footer follows below the column, outside the display: a drag on the column never pans to it (`touch-action: pinch-zoom`), so the display stays on its title.

The phone is a full-viewport layer sized on `--pad-unit` (`min(1dvh, 0.5dvw, 0.3rem)`). In landscape the pad splits into two equal halves: the floating stick on the left (base 45 units, knob 42 % of it), the dash on the right (35 units), the seat badge centred at the top. Before a match, in either orientation, the pad is hidden and the lobby sheet takes over: in portrait one column (spinning top, name field, ready button, ready count, and the landscape cue at the foot), in landscape two (top and name on the left, button and count on the right, no cue). During a round, in portrait, the pad is hidden behind a rotate cue. Outcome bands span the full width at mid-height.

Spacing on the phone uses xs 0.5rem, s 0.75rem, m 1rem, l 1.5rem, 2xl 3rem; the gutter and page padding are l, widening to 2xl above 56.25rem. Safe-area insets are always honoured.

## Elevation & Depth

Flat surfaces lifted by soft ambient shadows tinted with lacquer ink (never black, never coloured), plus inset double filets that read as inlay rather than height. Depth comes from the device's optics; the rendering stays near-flat.

### Shadow Vocabulary

- **Raised object** (`0 0.5cu 1.2cu` in lacquer-ink at 40 %, `--screen-shadow-raised`): QR card, plaques (room code and chosen game), roster and the brass button on the display.
- **Plaque inlay** (`inset 0 0 0 4px enamel, inset 0 0 0 7px ivory`, plus `0 4px 10px` ink 40 % on the phone; on the display an enamel inset at 56 % of `--plaque-filet`, then the ivory filet, then the raised shadow): the enamel plaque with its ivory inner filet. An unchosen game's plaque keeps only a 0.25cu ivory inset at 45 %, no shadow.
- **Walnut frame** (inset 0.5cu walnut, then 0.7cu walnut mixed 55 % with ink): the roster's frame.
- **Brass button inlay** (inset 0.4cu brass-deep, then 0.7cu brass): the display's action button.
- **Countdown** (the raised-object values as a `text-shadow`): the 16cu numerals over the arena.
- **Dash** (`0 6px 14px` ink 32 %), **knob** (drop-shadow `0 5px 6px` ink 35 %), **lobby top** (drop-shadow `0 10px 14px` ink 30 %), **bubble** (`0 8px 20px` ink 35 %), **control** (`0 4px 10px` ink 35 %): objects sitting on the phone's ground. On the phone these, the raised plaque shadow and the radii (control 4px, bubble 6px, plaque 12px) are the `--radius-phone-*` and `--shadow-phone-*` properties set by the `units` mixin of `presentation/styles/_phone.sass`, which the play page includes.

### Named Rules

### The 3D arena

The tops are lit; the plan is not. Felt, gutter and filets use unlit materials, so they render exactly at their token values. The tops take an ivory ambient light (0.6) and an ivory key light (2.4) from above, slightly left and toward the viewer, with dim room reflections (0.55) for the lacquer's sheen. Bodies are clearcoated lacquer (clearcoat 1, clearcoat roughness 0.12, roughness 0.38); the ring is brass metal (metalness 0.85, roughness 0.3); cap and glyph are matte. Shadows fall on a catcher tinted lacquer ink at 38 % with a soft filtered edge. A top leans with its speed (at most 0.3 rad), and a falling top tips up to 1.2 rad more as it sinks into the gutter. Reduced motion stops the spin, not the play.

### Named Rules

**The Ink Shadow Rule.** Every shadow is soft, offset downward, and tinted with lacquer ink between 30 and 40 %, the 3D scene's shadows included. No hard offsets, no glow, no coloured shadows.

**The Plan Under Objects Rule.** In 3D the table stays a plan and only what sits on it is modelled. The rim, gutter, ticks and centre ring are unlit filets at their 2D radii and opacities; depth comes from the tops, their light and their shadows.

## Shapes

Circles dominate: tops, arena rings, the dash disc, the stick base. Rectangles are café objects with small radii: the QR card (0.6cu), the brass button (0.5cu on the display, 4px on the phone), the roster (0.8cu), the plaque (1.2cu on the display, compact 0.6cu, 12px on the phone), the game plaques at the plaque's radius. Chips, spinners and tally pips are pills or circles. Dashed strokes mean an empty place or an invitation (the roster's free-seat socket, a dashed pictogram cue, the tap cue's ripple). Rings are gauges: the dash cooldown, the "Games" hold ring. Bands are full-bleed with brass top and bottom borders, wiped in from the left by `clip-path`; the display's band wipes out to the right. The modelled top is a lathe-turned body on a point, its shoulder carrying the brass ring and its flat crown carrying cap and glyph at the flat top's proportions.

## Components

### Seat Top

The signature object: a top seen from above in a 100 × 100 box. Lacquer disc (r 46) with a 4-unit ring (brass on the display, the seat's cap colour on the phone, chalk inside a band), cap disc (r 30), carved glyph scaled into the cap. Decorative; whoever shows it names the seat beside it. It is the roster's seat, the phone's badge, the lobby's spinning top, the stick's knob and the band's protagonist. In the 3D arena the same top is modelled from those proportions: lacquer body, brass torus at the shoulder, cap and glyph laid on its crown.

### Room Plaque

Enamel ground, ivory display lettering at 0.14em tracking, ivory inner filet, raised shadow. Text-box trimmed to the cap height where supported. Selectable, with a visually hidden label. One component serves both headers: full size in the join block (6.4cu, 1.2cu radius, 0.8cu filet), compact in the play header (2.6cu, 0.6cu radius, 0.45cu filet). The look is the `enamel` mixin of `presentation/styles/_plaque.sass`, resized through `font-size` and the `--plaque-*` properties; its `unpainted` mixin is the same plaque left as an outline. The phone's notice includes the same mixin at 3.625rem, a 12px radius and a 7px filet, raised by `--plaque-shadow`.

### Game Plaques

The game choice's tabs, shown only once the app hosts a second game: one plaque per game (3.4cu), a single-selection toggle group. The chosen game is enamelled; the others are `unpainted`: transparent, a faded ivory filet, soft-chalk capitals.

### Play Header

The display's header while a game runs, drawn from the game's standings: a display-voice title (8cu, one line) over a soft-chalk label subtitle. At rest the right side holds the compact plaque over a tap cue: a 5cu brass pictogram (dot, ring, and a dashed ripple swelling out on a loop) beside "Touch to play" in chalk. Any touch on the display outside its controls (holding "Games" never opens it) swaps them for the ivory QR card (12cu wide, unfolding from the header's corner) for 20 s (`QR_REVEAL_SECONDS`); the 0.2cu brass rule closing the header drops to 25 % and a full brass bar drains along it over those 20 s. Each touch restarts the time and the bar. The QR overlaps the rule rather than growing the header, whose height never changes. Reduced motion keeps the bar full and still.

### Announcement Band

The one place the display speaks to the whole room: a slate band with 0.3cu brass filets top and bottom, wiped in from the left across the header and out to the right. It leads with the tops concerned (7cu, overlapping by 2.2cu) and a chalk display-voice message (5.5cu, balanced). It carries falls (falls within 0.4 s share one band), the round winner, a drawn round (no top), and the match winner; new news replaces the text in place. It is always slate: the display has no won variant. Polite live region.

### Arena

The 3D scene described under Elevation & Depth, filling its row. Before the scene loads, and while no room is known, the game's `Preview` stands in: an SVG of the felt, gutter, filets and ticks projected through the scene's own camera (`arena-camera.ts`: 28° field of view, 14° tilt, 1.06 framing margin), sized to its host, so the scene replaces it in place. It carries no home marks. The countdown sits over the centre in chalk display numerals (16cu), each number beating in from 125 % scale and transparent.

### Top Tag

A name tag over each top on the arena, so a player finds their own top from across the room: a slate pill (2cu radius, raised by an ink shadow at 35 %) holding the flat seat top (2.6cu, ringed in chalk) and the seat's name in chalk display lettering (2.2cu), above a 0.2cu chalk stem at 80 % that ends on the top's far rim. The renderer projects that rim to the page; the tag follows it every frame. While the top's dash recharges, the pill turns brass with lacquer-ink lettering and an ink ring. An absent player's tag loses its fill for a dashed soft-chalk outline, its top at 50 %. A falling top's tag fades out by the time the top is halfway down the gutter. Decorative: the roster names the seats for assistive technology.

### Buttons

- **Brass button** ("Open the room" on the game choice, display notice action, phone retry): brass fill, lacquer-ink display lettering, small radius, raised. Hover mixes 22 % ivory into the brass; pressed scales to 0.96 to 0.97. On the display it is the `brass` mixin of `presentation/styles/_brass-button.sass` (inset brass-deep filet, raised shadow); the caller sizes it.
- **Games** (display, back to the game choice): a quiet control, no fill, a soft-chalk label beside a 3.4cu ring (slate-line track, chevron in the text colour). It answers only a hold: pressed, the label turns chalk and a brass arc fills the ring linearly over 1.2 s (`HOLD_TO_LEAVE_MS`), then the display goes home; released early, the ring empties. A passing touch never ends a game.
- **Dash button** (phone): a disc in the seat's cap colour with the lacquer as text, a display-voice "Foncer" under an arrow, ringed by a brass cooldown gauge (dasharray 101, one unit past the circumference so a full gauge closes). Pressed scales to 0.94; while cooling it drops to 50 % opacity and the ring refills linearly. Focus ring offset clears the gauge.
- **Focus:** a thick ring in `--focus`: brass on felt, the seat's cap colour on a seat ground, brass-deep / brass on the host pages.

### Seat Roster

Slate panel in a walnut frame, a 3 × 2 grid of seats; while a game runs it is the scoreboard. Taken seat: top plus display-voice name. While the room waits, a present seat whose player is ready shows a brass label under its name: a drawn tick and "Ready". Absent: top at 50 % opacity, name in soft chalk, an "absent" label. Free: a dashed brass socket (70 %) and a soft-chalk label. In play, a seat shows one tally pip per round the match needs: a 1.6cu brass ring that fills brass for each round won. A fallen seat keeps its place: its name takes a 0.35cu brass line-through and its top fades to 35 %. The match winner's place gets a 0.3cu inset brass ring with a 0.8cu radius. A footer row closes the panel: on the left a label-voice line, while waiting the player count until enough phones are present and then how many of them are ready ("2 of 3 ready"), the game's cue in play ("Premier à 3 manches"); on the right the "Games" control, waiting and in play.

### Game Showcase

The middle of the game choice: the real arena and its lacquered tops, driven by bots round after round (four demo seats, a short beat on their marks, a beat on a decided round, a stalled round started over). No room and no names. While it loads, the game's `Preview` stands in with the demo tops drawn flat on their marks through the same camera (lacquer, brass edge, cap and glyph over a soft ink shadow), the marks its first round starts from, so the first screen is never an empty arena. Reduced motion leaves the tops still on their marks. A touch on it opens the room, like the brass button.

### Lobby Sheet

The phone before a match, on the seat's lacquer, in `features/room/` since every game readies the same way. The seat's top spins above a name field: the name in the display voice and the cap colour, centred, over a 3px filet in the cap colour at 45 % that thickens to 6px at full strength while focused, with a pencil pictogram in the same faded filet at its end. Its placeholder is the seat's colour name at full strength, so an untouched field already reads as the player's name; the last name the phone picked is offered again from its storage. Below, the ready toggle (`aria-pressed`): a 5.5rem button filled with the cap colour, its "Ready" lettered in the lacquer, raised by the control shadow; pressed, it empties to a triple inset filet (cap, lacquer, cap at 45 %) with a tick before the word, and the name field loses its filet and pencil and stops taking input until the player presses again to take the mark back. Under it, a label-voice line in the cap colour: "1 of 3 ready", or the players the game still needs. Enter in the field readies too. The name is cleaned (trimmed, inner spaces collapsed, invisible characters dropped) before it is sent with the ready mark; the room refuses one that was not.

### Floating Stick

Its base is the arena plan, its radii taken from `ARENA_PLAN` like the scene's, in filets drawn in the cap colour at 50 % (95 % while held); its knob is the player's own top, turning as it moves. The base follows the thumb's anchor with an eased transition, dropped while held.

### Bands

Slate, full-width, brass top and bottom borders, wiped in from the left by `clip-path` on the slow transition. The phone's outcome band shows a top (ringed in chalk) and a display title ("In the gutter", "Round won" or "Match won"), with a label detail, and closes on the seat's tally: the roster's pips at 1.25rem, brass on slate. It is the only place the phone shows the score; in play the display's roster carries it. The won variants turn brass with ink borders, lettering and pips, and spin their top. The display's counterpart is the Announcement Band above. Both include the `slate` mixin of `presentation/styles/_band.sass` (ground, brass filets, wipe in), each with its own filet width.

### Status chips

Slate, label voice, with a brass (display) or current-colour (phone) spinning ring. Pill on the display, 6px bubble on the phone.

## Do's and Don'ts

### Do:

- **Do** draw every ring, rule, tick and gauge as a brass filet, ranking them by opacity (100 / 70 / 55 / 40 %).
- **Do** show a seat with its top and its name together, using `data-seat-slot` to resolve `--seat`, `--seat-cap` and `--seat-mark`.
- **Do** set names, codes, titles and button labels in Big Shoulders Display 900 uppercase, and everything else in Barlow Semi Condensed 500 / 700.
- **Do** size display surfaces in `--cu` and keep them inside the 3 % safe area.
- **Do** tint every shadow with lacquer ink at 30 to 40 %.
- **Do** keep the bistrot look fixed regardless of system theme; the game choice stands on the felt too, and only the legal page and its footer follow light / dark.
- **Do** let a game speak to the room only through its standings: title, subtitle, cue, pips, fallen and winner marks, and the one announcement band across the header.
- **Do** read every 3D colour from the CSS tokens through the probe.

### Don't:

- **Don't** paint gradients, glass, blur or glow onto any surface; the table is flat felt, and the only shading is light falling on the modelled lacquer.
- **Don't** use a seat lacquer for anything that is not a player.
- **Don't** wrap content in generic UI cards; a panel is a table object (slate in walnut, enamel plaque, ivory QR card).
- **Don't** add a third weight to the body face or a second weight to the display face.
- **Don't** model the arena itself: in the 3D scene the platform, gutter, rim, ticks and centre ring stay unlit felt and brass filets; only the tops are modelled and lit.
- **Don't** put shell UI over the arena; news goes in the header band, standings on the roster.
- **Don't** hard-code a colour in the renderer.
