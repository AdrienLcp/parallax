# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Colleagues at the office**, during breaks or after work: short, repeated rounds between people who know each other.
- **Visitors and clients** during demos: strangers who play once to discover the display, with nobody to explain the rules.

Both stand in front of the same display, and each player holds their own phone.

## Product Purpose

A party-game host for the office's Looking Glass display. The display shows the game; phones are the controllers and join by scanning a QR code. The app hosts several games. The first is a sumo: 2 to 6 phones each drive a spinning top in an arena, and the last one on the board wins. A claw machine is being built. Planned next, all upright in the alcove: a tower to stack as high as possible without it falling, a shooting gallery with targets at several depths, and a ring toss onto pegs set at different depths.

The tower, shaped on 2026-11-24 and parked until the sumo is finished: varied wooden blocks (planks, cubes, cylinders, arches, triangles) drawn at random; the phone's stick moves the floating block across AND in depth, a button drops it, so aiming means reading the alcove. Two rules, picked in the lobby: one shared tower built in turns, where whoever topples it loses, or one tower each racing for height (side by side, so best at 2 or 3).

The lobby's choices (game, rule) are made from the players' own phones: any seated player can change them until everyone is ready, and the display shows the current choice. A room outlives its games: a game over, or stopped, brings everyone back to the same room's lobby, seats kept, to play the same game again or another. Removing a player and stopping a game are done at the display's mouse only (decided 2026-11-25): any phone could empty the room in two taps. A player leaves from their own phone. No second QR code for a non-playing host: two codes on the display would leave a visitor unsure which to scan, and a demo host already has the PC's mouse.

Success: a group walks up, scans, and is playing within a minute, without reading instructions. **Depth is the point of every game:** each one is designed to read as objects inside the display's alcove, seen by players standing centred at about 1.5 m, so the player count follows what that viewing spot allows.

## Positioning

The game lives inside a physical holographic alcove (the HLD), so depth comes from the device, not from the rendering. Phones as controllers mean no app install and no hardware beyond what people already carry.

## Operating Context

- **The display:** a Looking Glass unit of about 27" on a rolling stand (EDID `LKG H02B0002`, 2025), portrait 2160×3840, **without touch**: it is driven as an extended monitor of a PC, and the phones are the only input. The image blends with a fixed alcove built into the optics. Details and creative rules are in `docs/display-hardware.md`.
- **Viewing distance:** the display is read from a few metres away by a standing group, and is never scrolled.
- **The phones:** held in one or both hands at about 40 cm, used by thumb while the eyes stay on the big display.
- **The network:** a company Wi-Fi that often isolates devices from each other, hence a hosted room server rather than a local one.

## Capabilities and Constraints

- **Rooms:** a room has a 4-letter code and up to 6 seats. A seat's slot (0–5) gives the player's colour.
- **Seats:** a phone that goes silent for 12 s shows as absent. Its seat is released 60 s after it left; a phone back before then takes its seat again.
- **Phone connection states:** connecting, open, reconnecting, refused.
- **Sumo:** starts at 2 players, takes up to 6. Inputs: a stick (sent at 20 Hz) and a dash.
- **Rendering on the display:** one perspective camera, a solid unlit backdrop, soft grounded shadows. The 3D scene rests on the alcove's floor and keeps at least 25 px (of 1920) inside its walls, roof and opening on the display, so nothing spills past an edge wherever the players stand; flat 2D content keeps a ~3 % safe area.
- **QR:** plain 2D on a flat backdrop, inside the safe area, always visible since the display cannot be touched to reveal it; its contrast must be checked on the device (inverted is the fallback).
- **Languages:** French and English. A phone follows its own language.

## Brand Commitments

None. "Parallax" is a working name that may change: build nothing around it, and show no company logo.

## Evidence on Hand

No photos of the device, no players' feedback, no existing brand assets. Do not invent testimonials or usage figures.

## Product Principles

1. **Playing within a minute:** scan, pick nothing, play. Every extra step costs a player.
2. **The display explains itself:** a stranger understands what to do from across the room, without anyone presenting.
3. **Eyes on the big screen:** the phone works blind under the thumb, and it only says what the player cannot see on the display.
4. **Each game is its own world, and the host stays neutral:** the shell (room, QR, seats) is shared, while each game brings its own look.

## Accessibility & Inclusion

Players must be told apart by more than colour: up to 6 seat colours have to stay distinguishable for colour-blind players, so each seat also needs a shape or mark.
