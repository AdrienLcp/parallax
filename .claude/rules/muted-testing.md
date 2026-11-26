# Test the display muted

Sound comes out of Adrien's speakers, not yours, and has woken him at night.
Any browser you drive (Playwright, Claude in Chrome, the app's built-in pane)
stays **muted** — you never unmute it.

- The mute persists in `localStorage` under `parallax:sound-muted` = `"true"`
  (`sound-muted-storage.ts`). Write it **before** the page loads — Playwright
  `addInitScript`, or set it then reload before the first click. Pressing the
  mute control after load is too late: the sound already played.
- The Playwright MCP launches Chromium with `--mute-audio`; the other
  browsers are only covered by the stored flag.
