import { ARENA_PLAN } from './arena-plan'
import { SUMO_TUNING } from './sumo-tuning'

/**
 * The low walnut drum the arena is turned from, in arena units: heights from
 * the alcove's floor, radii from the drum's axis. The felt platform is raised
 * on it, ringed by a ditch the tops fall into, then a walnut lip and a brass band.
 */
export const ARENA_DRUM = {
  bandHeight: 0.034,
  /** The foot of the walnut side, on the alcove's floor. */
  baseRadius: 1.285,
  ditchDepth: 0.07,
  /** The brass filet along the lip's inner edge. */
  lipFiletWidth: 0.012,
  /** How far the lip stands above the felt. */
  lipHeight: 0.03,
  lipInnerRadius: ARENA_PLAN.gutter,
  lipOuterRadius: 1.25,
  surfaceHeight: 0.16
} as const

export const DRUM_LIP_TOP = ARENA_DRUM.surfaceHeight + ARENA_DRUM.lipHeight

export const DITCH_FLOOR = ARENA_DRUM.surfaceHeight - ARENA_DRUM.ditchDepth

/** Where a fallen top comes to rest: midway across the ditch. */
export const DITCH_REST_RADIUS =
  (SUMO_TUNING.arenaRadius + ARENA_DRUM.lipInnerRadius) / 2
