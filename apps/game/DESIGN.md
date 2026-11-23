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
  maple: "oklch(82.6% 0.079 77.2)"
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
  dash-button:
    rounded: "{rounded.pill}"
  seat-roster:
    backgroundColor: "{colors.slate}"
    textColor: "{colors.chalk}"
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

A table game seen from directly above. The display is a billiard-green felt tabletop; every structure on it (arena rim, gutter edge, ticks, rules between zones, cooldown gauge) is a brass filet drawn on that felt, never a modelled object. The objects that sit on the table are the furniture of a café: lacquered spinning tops in six seat colours, an enamel-blue plaque for the room code, an ivory QR card, a slate scoreboard framed in walnut. The phone is the same table seen through one seat: its whole ground turns that seat's lacquer and carries the player's own top.

The display is read from a few metres away by a standing group and is never scrolled, so it is sized on one unit (`--cu`, 1 % of the portrait panel's height, capped by its 9:16 width) and holds a 3 % safe area that never touches the alcove's walls. The phone is used blind under two thumbs, so it carries only the player's top and name, a stick and one button. Density is low on both: few objects, very large uppercase lettering, no explanatory text beyond two pictogram cues.

The bistrot look is fixed whatever the system theme. Only the host's secondary pages (home, legal, footer) follow light or dark through the neutral `ground` / `ink` tokens. Today the bistrot tokens sit at `:root` and are shared by the room shell (QR, plaque, roster) and the sumo; the product principle is that each game brings its own world while the host stays neutral, so a second game is the moment to split them.

**Key Characteristics:**
- Felt ground, brass filets for every line and ring, no gradients, no glass.
- Six lacquered tops, each with a carved glyph, so seats differ by shape as well as colour.
- Big Shoulders Display Black, uppercase, for everything named; Barlow Semi Condensed for everything read.
- Depth from soft ink-tinted shadows and inset double filets, never from blur or glow.
- Display sized in `--cu` units inside a 3 % safe area; controller sized in rem and `--pad-unit`.

## Colors

A dark felt-and-brass table with café objects in enamel, walnut, slate and ivory, and six lacquers that are the only saturated colours on screen.

### Primary

- **Billiard Felt** (felt): the ground of the display page and of every phone screen that is not inside a seat (notices, connecting). The arena's platform is felt lifted 6 % toward chalk.
- **Deep Felt** (felt-deep): the gutter ring around the arena, the place a top falls into.

### Secondary

- **Brass** (brass): every filet (arena rim at full strength, gutter edge at 55 %, centre ring at 40 %, ticks at 70 %), the rule under the join block, the roster's empty-seat sockets, the dash cooldown ring, the band's top and bottom borders, the primary action fill, and the focus ring on bistrot surfaces. Also the ring around each top on the display.
- **Deep Brass** (brass-deep): the inner filet inset in a brass button, and the focus colour on the neutral light theme.

### Tertiary

- **Enamel Blue** (enamel): the room-code plaque only, with an ivory inner filet.
- **Walnut** (walnut): the frame around the slate roster, doubled by a darker walnut/ink filet.
- **Maple** (maple): defined with the table set, not yet used by any shipped surface.

### Neutral

- **Slate** (slate): the roster panel, the ejection and outcome bands, the reconnecting chip and bubble.
- **Slate Line** (slate-line): the rule under each roster seat.
- **Chalk** (chalk): all text written on felt or slate.
- **Soft Chalk** (chalk-soft): secondary text on slate (free seat, absent player, band detail).
- **Ivory** (ivory): the QR card's quiet zone, the plaque lettering and filet, the cap of dark tops.
- **Lacquer Ink** (lacquer-ink): QR modules, text on brass, the cap of light tops, and the tint of every shadow.
- **Host neutrals** (ground, ink, ink-muted, rule, rule-strong, selection): the host's secondary pages, following the system theme.

### Seat lacquers

Six seats, by slot 0 to 5: **Red** (seat-red), **Ivory** (seat-ivory), **Black** (seat-black), **Ochre** (seat-ochre), **Blue** (seat-blue), **Green** (seat-green). An element with `data-seat-slot` hands its subtree three roles: `--seat` (the lacquer), `--seat-cap` (ivory on dark lacquers, lacquer-ink on light ones; the text colour on that seat) and `--seat-mark` (the glyph carved in the cap, the opposite of the cap). Glyphs by slot: circle, triangle, square, diamond, cross, hexagon.

### Named Rules

**The Filet Rule.** Structure is drawn, not filled: a ring, a rule, a tick or a gauge is a brass stroke on felt or slate, with opacity carrying its rank. No filled shapes stand in for lines.

**The Lacquer Rule.** The six seat lacquers are the only saturated colours, and they appear only as a seat: a top, a phone ground, a named seat. A seat colour never decorates anything that is not a player.

**The Two Marks Rule.** A seat is always shown by its top (lacquer plus carved glyph) and its name together, never by colour alone.

## Typography

**Display Font:** Big Shoulders Display, weight 900 only (with a size-adjusted Arial fallback)
**Body Font:** Barlow Semi Condensed, 500 and 700 (with a size-adjusted Arial fallback)

**Character:** A heavy condensed poster capital, like a café menu board or a scoreboard, against a narrow, sturdy grotesque that stays legible at a glance. Both are self-hosted woff2 (latin and latin-ext), the three latin files preloaded.

### Hierarchy

- **Display** (900, uppercase, 0.9 line-height, 0.02em tracking, balanced): every name, title, room code and button label. Sized by the caller: on the phone the lobby name (4.875rem), the band title (4rem), the plaque (3.625rem), the notice headline and rotate cue (2.875rem), the seat badge (2rem), the dash label (1.375rem). On the display, in `--cu`: join heading and notice (5.4), plaque (6.4), ejection message (7), roster name (3.2).
- **Plaque** (display voice, 0.14em tracking): the four-letter room code only, its trailing tracking removed from the end padding.
- **Label** (700, 1.4 line-height): cues, statuses, the free / absent seat text, band detail. 1.25rem on the phone; 1.7 to 2.4 `--cu` on the display.
- **Body** (500, 1rem, 1.6 line-height, `text-wrap: pretty`): running text on the host's secondary pages.
- **Small** (500, 0.875rem, 1.5 line-height): footer and notes on the host pages.

### Named Rules

**The Two Weights Rule.** The body face ships 500 and 700 only; anything heavier than regular is written 700, and font synthesis is off.

**The Names Are Capitals Rule.** What a player must read from across the room (a name, the code, an outcome) is in the display voice; everything else is a label in the body face.

## Layout

The display is a fixed portrait column, `56.25cu × 100cu` (9:16), centred on felt, with a block safe area of 1.7cu and an inline one of 1.6875cu. Three rows: the join block on top (ivory QR at 23cu wide beside the heading and plaque, two pictogram cues under a brass rule), the arena filling the middle, the roster at a fixed 22cu at the bottom. The roster is a 3 × 2 grid of seats, each a top beside its name over a slate-line rule.

The phone is a full-viewport layer sized on `--pad-unit` (`min(1dvh, 0.5dvw, 0.3rem)`). In landscape the pad splits into two equal halves: the floating stick on the left (base 45 units, knob 42 % of it), the dash on the right (35 units), the seat badge centred at the top. In portrait the pad is hidden and a sheet takes over: the lobby (large spinning top and name) before a round, a rotate cue during one. Outcome bands span the full width at mid-height.

Spacing on the phone uses xs 0.5rem, s 0.75rem, m 1rem, l 1.5rem, 2xl 3rem; the gutter and page padding are l, widening to 2xl above 56.25rem. Safe-area insets are always honoured.

## Elevation & Depth

Flat surfaces lifted by soft ambient shadows tinted with lacquer ink (never black, never coloured), plus inset double filets that read as inlay rather than height. Depth comes from the device's optics; the rendering stays near-flat.

### Shadow Vocabulary

- **Raised object** (`0 0.5cu 1.2cu` in lacquer-ink at 40 %): QR card, plaque, roster and the brass button on the display.
- **Plaque inlay** (`inset 0 0 0 4px enamel, inset 0 0 0 7px ivory`, plus `0 4px 10px` ink 40 %): the enamel plaque with its ivory inner filet.
- **Walnut frame** (inset 0.5cu walnut, then 0.7cu walnut mixed 55 % with ink): the roster's frame.
- **Brass button inlay** (inset 0.4cu brass-deep, then 0.7cu brass): the display's action button.
- **Dash** (`0 6px 14px` ink 32 %), **knob** (drop-shadow `0 5px 6px` ink 35 %), **lobby top** (drop-shadow `0 10px 14px` ink 30 %), **bubble** (`0 8px 20px` ink 35 %), **control** (`0 4px 10px` ink 35 %): objects sitting on the phone's ground.

### Named Rules

**The Ink Shadow Rule.** Every shadow is soft, offset downward, and tinted with lacquer ink between 30 and 40 %. No hard offsets, no glow, no coloured shadows.

## Shapes

Circles dominate: tops, arena rings, the dash disc, the stick base. Rectangles are café objects with small radii: the QR card (0.6cu), the brass button (0.5cu on the display, 4px on the phone), the roster (0.8cu), the plaque (1.2cu on the display, 12px on the phone). Chips and spinners are pills. Dashed strokes mean an empty place (the roster's free-seat socket, a dashed pictogram cue). Bands are full-bleed with brass top and bottom borders, wiped in by `clip-path`.

## Components

### Seat Top

The signature object: a top seen from above in a 100 × 100 box. Lacquer disc (r 46) with a 4-unit ring (brass on the display, the seat's cap colour on the phone, chalk inside a band), cap disc (r 30), carved glyph scaled into the cap. Decorative; whoever shows it names the seat beside it. It is the roster's seat, the phone's badge, the lobby's spinning top, the stick's knob and the band's protagonist.

### Room Plaque

Enamel ground, ivory display lettering at 0.14em tracking, ivory inner filet, raised shadow. Text-box trimmed to the cap height where supported. Selectable, with a visually hidden label.

### Buttons

- **Brass button** (display notice action, phone retry): brass fill, lacquer-ink display lettering, small radius, raised. Hover mixes 22 % ivory into the brass; pressed scales to 0.96 to 0.97.
- **Dash button** (phone): a disc in the seat's cap colour with the lacquer as text, a display-voice "Foncer" under an arrow, ringed by a brass cooldown gauge (dasharray 101, one unit past the circumference so a full gauge closes). Pressed scales to 0.94; while cooling it drops to 50 % opacity and the ring refills linearly. Focus ring offset clears the gauge.
- **Focus:** a thick ring in `--focus`: brass on felt, the seat's cap colour on a seat ground, brass-deep / brass on the host pages.

### Seat Roster

Slate panel in a walnut frame, a 3 × 2 grid of seats. Taken seat: top plus display-voice name. Absent: top at 50 % opacity, name in soft chalk, an "absent" label. Free: a dashed brass socket and a soft-chalk label. A label-voice note closes the panel.

### Floating Stick

Its base is the arena plan in filets drawn in the cap colour at 50 % (95 % while held); its knob is the player's own top, turning as it moves. The base follows the thumb's anchor with an eased transition, dropped while held.

### Bands

Slate, full-width, brass top and bottom borders, wiped in from the left by `clip-path` on the slow transition. The phone's outcome band shows a top and a display title, with a label detail; the won variant turns brass with ink borders and lettering and spins its top. The display's ejection band follows the same form in `--cu`.

### Status chips

Slate, label voice, with a brass (display) or current-colour (phone) spinning ring. Pill on the display, 6px bubble on the phone.

## Do's and Don'ts

### Do:

- **Do** draw every ring, rule, tick and gauge as a brass filet, ranking them by opacity (100 / 70 / 55 / 40 %).
- **Do** show a seat with its top and its name together, using `data-seat-slot` to resolve `--seat`, `--seat-cap` and `--seat-mark`.
- **Do** set names, codes, titles and button labels in Big Shoulders Display 900 uppercase, and everything else in Barlow Semi Condensed 500 / 700.
- **Do** size display surfaces in `--cu` and keep them inside the 3 % safe area.
- **Do** tint every shadow with lacquer ink at 30 to 40 %.
- **Do** keep the bistrot look fixed regardless of system theme; only host secondary pages follow light / dark.

### Don't:

- **Don't** use gradients, glass, blur or glow; the table is flat felt and lacquer.
- **Don't** use a seat lacquer for anything that is not a player.
- **Don't** wrap content in generic UI cards; a panel is a table object (slate in walnut, enamel plaque, ivory QR card).
- **Don't** add a third weight to the body face or a second weight to the display face.
- **Don't** model the arena as an object in this layer; it is a plan in filets until the 3D scene replaces it.
