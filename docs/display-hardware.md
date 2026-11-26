# Display hardware

The office display is a Looking Glass unit: a portrait screen of about 27", on a stand, **with no touch panel**. Its EDID names the maker `LKG`, product code `H02B0002`, built in 2025, and it runs at 2160×3840 in portrait. On 2026-11-24 it was plugged into a Windows PC as an extended monitor (screen 2), and a browser in fullscreen on it was enough: the depth comes from the optics, not from a special driver or SDK. This page records what that means for a Three.js web app. Research dates from 2026-11-23, corrected on 2026-11-24 after the first test on the unit.

## What the first test showed

On 2026-11-24 the app ran on the unit. The image was clean and sharp, but flat: the arena read as seen from above, with no depth. Two facts follow:

- **The panel shows a plain 2D frame cleanly**, so it is not a lenticular light-field unit, which smears a plain frame into soft, rainbow-fringed slices.
- **The camera was the wrong one for this display.** It leaned 14° from straight above, with a 28° field of view, and the table filled the frame. No depth can come out of that, whatever the display.

## Likely model: Looking Glass HLD 27" (Hololuminescent Display)

- Portrait 2160×3840, 500 nits, 60 Hz.
- Optional capacitive 10-point touch panel. The office unit has none: nothing on the display may wait for a touch, and the phones are the only input.
- Inputs: HDMI 2.0 and DP 1.2. Its USB-A port is power only. It has a 3.5 mm jack, so check whether the unit has speakers before counting on sound.
- No built-in computer. It ships with a Raspberry Pi 4 (2 GB) "Demo Media Player" that plays MP4 files from a USB stick. That small Linux box is probably what people take for "Android". A browser running Three.js at 4K will struggle on it, so the app needs a laptop, a mini PC or a BrightSign HTML5 player. Looking Glass recommends at least an RTX 3060 or an Apple M1. The first test ran from a desktop PC, so the GPU budget for a Pi-class player is still unknown.
- The HLD line comes in 16", 27" and 86". There is no 32" HLD.

**How the HLD makes depth.** It is an ordinary LCD with an optical stack in front that shows a recessed box, the "alcove". The video blends with that alcove, roughly like a multiply. Depth comes from content that sits _inside_ the alcove: an object standing on its floor, seen from the front. A frame that fills the screen with its own floor or walls fights the optics and reads flat.

Official creative rules (from the HLD docs and the Unity and Unreal templates):

- One standard perspective camera, framed to match the alcove. The templates ship that camera, an Alcove prefab and a Boundary Helper. **The camera's height, pitch and field of view are not published**: read them from the template project, or match them on the unit by eye.
- A solid, unlit, opaque backdrop. Do not render the alcove, its floor or its walls.
- Soft shadows grounded on the floor, none on the side walls, at most a soft one on the back wall. A subtle floor reflection is optional.
- The subject is centred and stays inside the safe area: 100 px top and bottom, 108 px left and right at 4K, so 1944×3640 active. It never overlaps the alcove's roof or walls. This is a style rule, not an optical limit: on the office unit, content that touches the roof, the floor or a wall reads as touching at every depth (see below). Parallax lets its 3D scene touch the alcove but never cross it, and prefers scenes that float clear of every edge; `alcoveInterior` in `apps/game/src/features/alcove/alcove-bounds.ts` gives a box 25 px inside, for what must not touch. Every rule a scene follows in the alcove: `alcove-rules.md`.
- Slow orbits and rotations read best.

The QR code is plain 2D pixels, so it should scan. Place it inside the safe area, on flat backdrop. Check its contrast on the unit because of the blend. An inverted QR (light on dark) is the fallback.

Sources:

- https://hlddocs.lookingglassfactory.com/resources/hardware-specs.md
- https://checkout.lookingglassfactory.com/cdn/shop/t/35/assets/HLD-27-specsheet-RAD5.pdf
- https://hlddocs.lookingglassfactory.com/content-pipelines/creating-real-time-apps.md
- https://hlddocs.lookingglassfactory.com/content-pipelines/creating-real-time-apps/unity.md
- https://hlddocs.lookingglassfactory.com/creative-guidelines/products.md
- https://hlddocs.lookingglassfactory.com/resources/media-specs-and-encoding.md

## Ruled out: lenticular light-field displays (27" Light Field, 16" and 32" Spatial)

These render 45 to 100 views through a slanted lens sheet. A plain frame looks smeared on them, which the test did not show. None of them has built-in touch.

- **27" Light Field:** 2880×5120, needs a GPU PC with Looking Glass Bridge.
- **32" Spatial Gen3:** 4320×7680 over two DisplayPort cables.
- **16" Spatial:** no touch, no computer.

The web path for these displays would be `@lookingglass/webxr`. Its last release is 0.6.0, from 2024-07. It needs Looking Glass Bridge on the host and opens its output in a popup window.

## How to confirm on site

| Check            | HLD                                                                      | Lenticular                                         |
| ---------------- | ------------------------------------------------------------------------ | -------------------------------------------------- |
| Back of the unit | Raspberry Pi 4 on micro-HDMI; HDMI + DP + power-only USB-A + 3.5 mm jack | Two DisplayPort cables, or USB-C with a status LED |
| Label            | "Hololuminescent Display (HLD)"                                          | "Spatial Display" / "Light Field", serial LKG-…    |
| Walk sideways    | Only the alcove seems to shift                                           | The content itself shows parallax                  |
| Desktop text     | Crisp                                                                    | Smeared                                            |

## Rendering strategy

One renderer, written for the HLD: a fullscreen 9:16 frame, one perspective camera framed on the alcove, the arena as an object on the alcove's floor, solid backdrop, grounded soft shadows, content in the safe area, plain pointer events. The camera's numbers are matched on the unit by eye until the template's values are known.

## Measured alcove (2026-11-25)

Traced by eye on the unit, white backdrop, from the players' spot (standing, centred, about 1.5 m), with the mock bench's calibration page. Raw points: `docs/display-calibration/2026-11-25.json`. The first rough trace of 2026-11-24 (`2026-11-24.json`) put the roof and the back wall a few percent off, enough that a rail drawn on its roof visibly missed the real one.

In % of the portrait screen (x from the left, y from the top):

- **Floor:** a thin strip at the very bottom. Front edge at y ≈ 97.9 % (x 4.7 → 96.8 %), back edge at y ≈ 90.6 % (x 12.2 → 87.3 %).
- **Back wall:** x 12 → 87.6 %, y 9.5 → 90.6 %. It fills almost the whole screen.
- **Roof front edge:** y ≈ 2.3 %.

What it implies: the viewer looks at the alcove almost level, so its floor shows only as a thin strip. Content stands on that strip and rises in front of the back wall. A horizontal arena seen from this eye is almost edge-on. Games read best when their action happens upright, in the plane of the back wall and just in front of it.

Solved as a box seen by one eye (`apps/game/src/features/alcove/`): the opening is 1 unit wide, the box 1.87 tall and 0.91 deep, the eye about 4.9 units in front of the opening at mid-height, looking straight ahead at (45.9 %, 49.6 %) of the screen. The fit misses the traced corners by 0.4 % of the screen. The eye's distance assumes players 1.5 m away from a 27" screen.

**Contact check.** A wooden frame drawn in the solved box, wedged between roof, floor and both walls, was moved through five depths (0, 25, 50, 75 and 100 %) and adjusted by eye until it touched (the mock bench's contact page, result in `docs/display-calibration/2026-11-25-contact.json`). Every contact landed within 0.5 % of the screen of the solve, and at 25 and 50 % it touched without any adjustment. The one trend: at the back, the left wall sits about 1 % of the screen further left than solved. So the solved box is the box players see, and a game may put things against its roof, floor and walls at any depth.

To recalibrate, trace the alcove again, replace `measured-alcove.ts`, then repeat the contact check: every game moves at once.
