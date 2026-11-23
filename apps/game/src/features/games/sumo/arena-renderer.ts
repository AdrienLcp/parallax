import type { ArenaFrame } from './arena-frame'

/**
 * What draws the arena on the display. The default one renders a single flat
 * portrait frame; a light-field one can replace it without the game knowing.
 */
export type ArenaRenderer = {
  /** Draws `frame`; `seconds` is the wall time since the previous call, for what only moves to look alive. */
  draw: (frame: ArenaFrame, seconds: number) => void
  dispose: () => void
}

/** Builds a renderer that fills `host` and follows its size. */
export type CreateArenaRenderer = (host: HTMLElement) => ArenaRenderer
