import type { SeatSlot } from '@parallax/protocol/room'

import type { ArenaFrame } from './arena-frame'
import type { ArenaTuning } from './arena-tuning'

/** The point just above a top, in CSS pixels from the host's top-left corner. */
export type TagAnchor = {
  readonly slot: SeatSlot
  readonly x: number
  readonly y: number
}

/**
 * What draws the arena on the display. The default one renders a single flat
 * portrait frame; a light-field one can replace it without the game knowing.
 */
export type ArenaRenderer = {
  /**
   * Draws `frame` seen from the camera orbited `azimuth` radians around the
   * drum; `seconds` is the wall time since the previous call, for what only
   * moves to look alive. Returns where each drawn top's name tag hangs, or
   * nothing when the renderer labels the tops itself.
   */
  draw: (
    frame: ArenaFrame,
    seconds: number,
    azimuth: number
  ) => readonly TagAnchor[]
  dispose: () => void
  /** Takes new lens, shape and lighting at once, from the next drawn frame. */
  tune: (tuning: ArenaTuning) => void
}

/** Builds a renderer that fills `host`, follows its size, and starts from `tuning`. */
export type CreateArenaRenderer = (
  host: HTMLElement,
  tuning: ArenaTuning
) => ArenaRenderer
