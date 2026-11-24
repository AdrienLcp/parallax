import { type ArenaLens, SHIPPED_LENS } from './arena-camera'
import { type ArenaMotion, SHIPPED_MOTION } from './arena-orbit'
import { type ArenaShape, SHIPPED_SHAPE } from './arena-shape'

/** How the scene lights the drum and how dark its grounded shadows fall. */
export type ArenaLighting = {
  readonly keyLightIntensity: number
  /** How dark a grounded shadow falls, in lacquer ink. */
  readonly shadowOpacity: number
}

export const SHIPPED_LIGHTING: ArenaLighting = {
  keyLightIntensity: 2.4,
  shadowOpacity: 0.5
}

/** Everything about the arena that is tuned on the display itself, by eye, rather than by the rules. */
export type ArenaTuning = {
  readonly lens: ArenaLens
  readonly lighting: ArenaLighting
  readonly motion: ArenaMotion
  readonly shape: ArenaShape
}

export const SHIPPED_ARENA_TUNING: ArenaTuning = {
  lens: SHIPPED_LENS,
  lighting: SHIPPED_LIGHTING,
  motion: SHIPPED_MOTION,
  shape: SHIPPED_SHAPE
}
