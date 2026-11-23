# Display hardware

The office display is a Looking Glass unit: a portrait touchscreen on a rolling stand. People on site believe it has no PC attached and runs "something like Android". The exact model has not been identified yet. This page records what each candidate means for a Three.js web app. The research dates from 2026-11-23.

## Likely model: Looking Glass HLD 86" (Hololuminescent Display)

It matches every observed trait:

- portrait 2160×3840;
- 10-point IR multi-touch;
- floor stand;
- no PC.

It ships with a "Demo Media Player", a Raspberry Pi 4 box that plays MP4 files from a USB stick.

**The HLD needs no multi-view rendering.** It is a regular 2D panel placed in front of a fixed holographic "alcove" built into the optics. The video blends with that alcove, roughly like a multiply blend. A web app therefore renders one normal 9:16 frame in fullscreen Chromium.

**A browser cannot run on the demo player**, which only plays MP4. To run the app, connect a machine to the display:

- **Machines that work:** a laptop or mini PC, or a BrightSign HTML5 player.
- **Connection:** USB-C with DP Alt Mode carries video and touch on one cable. HDMI or DP plus a USB cable also works.
- **Touch:** it arrives as standard HID multitouch, so browser pointer events map 1:1.

Official creative rules (from the Unity and Unreal templates) that the scene must follow:

- One standard perspective camera framed on the alcove.
- A solid, unlit backdrop. Do not render the alcove itself.
- Soft grounded shadows on the floor, none on the side walls. A subtle floor reflection is optional.
- Keep the subject inside the safe area: about 3% margins, so 1944×3640 active at 4K. It must never overlap the alcove's roof or walls.
- Slow orbits and rotations read best.

The QR code is plain 2D pixels, so it should scan. Place it inside the safe area on flat backdrop. Check its contrast on the device because of the blend; an inverted QR (light on dark) is the fallback.

Sources:

- https://hlddocs.lookingglassfactory.com/getting-started/hld-86-setup-guide
- https://hlddocs.lookingglassfactory.com/content-pipelines/creating-real-time-apps.md
- https://hlddocs.lookingglassfactory.com/creative-guidelines/products.md
- https://hlddocs.lookingglassfactory.com/resources/media-specs-and-encoding.md

## Other candidates: light-field displays (27" Light Field, 16"/32" Spatial)

These render 45 to 100 views interlaced through a lenticular sheet.

The official web path is `@lookingglass/webxr`, latest version 0.6.0 from 2024-07. It needs Looking Glass Bridge on the host for calibration, and Bridge runs only on Windows, macOS and Ubuntu. "Enter Looking Glass" opens a popup on the display, and touch events land in that popup (`LookingGlassConfig.popup`).

**Without Bridge**, set `LookingGlassConfig.calibration` by hand from `LKG_calibration/visual.json`, which is on the display's USB drive. The other option is a custom quilt pass plus a lenticular shader:

- `pitch' = pitch * screenW / DPI * cos(atan(1 / slope))`
- `tilt = screenH / (screenW * slope)`, negated when `flipImageX` is set
- `subp = 1 / (screenW * 3)`
- view per subpixel: `v_c = 1 - fract((uv.x + subp * c + uv.y * tilt) * pitch' - center)`, with c = 0, 1, 2 for R, G, B. The colour is sampled from quilt tile `floor(v_c * numViews)`.

Each view is only about 500 to 750 px wide, so keep the action near the zero-parallax plane and keep depth shallow. Draw the QR code as a flat overlay after the lenticular pass.

Sources:

- https://www.npmjs.com/package/@lookingglass/webxr
- https://lfdocs.lookingglassfactory.com/software/looking-glass-bridge

## How to identify the unit on site

| Check                 | HLD                                                          | Light field                                  |
| --------------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Box at the back       | Raspberry Pi with a USB stick and prev / loop / next buttons | Serial `LKG-xxxx`                            |
| Plugged into a laptop | Plain monitor at 2160×3840 or 1080×1920                      | USB drive with `LKG_calibration/visual.json` |
| Demo content          | Seems to sit inside a fixed 3D box behind the glass          | Parallax changes as you move sideways        |

## Rendering strategy

1. **Default renderer, written first:** "flat portrait". A fullscreen 9:16 scene with one perspective camera, solid backdrop, grounded soft shadows, content in the safe area and plain pointer events. It covers the HLD and any regular screen.
2. **Optional "lightfield" renderer, written later behind a flag:** `@lookingglass/webxr` when Bridge is present, otherwise a custom quilt pass with a lenticular shader fed by `visual.json`. Build it only if the unit turns out to be a light-field model.
