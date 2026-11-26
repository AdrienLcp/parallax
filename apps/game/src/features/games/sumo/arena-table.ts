import { SUMO_TUNING } from './sumo-tuning'

/**
 * The guéridon the arena is, in arena units: heights from the alcove's floor,
 * radii from the column's axis. A walnut slab on a cast-iron column, its felt
 * running out to a brass edge with no lip: a top pushed past the edge falls
 * to the floor (Adrien's mock E, 2026-11-26).
 */
export const ARENA_TABLE = {
  /** The brass band around the slab's edge. */
  bandHeight: 0.034,
  /** Where the felt meets the brass edge, a little past the ring-out radius. */
  edgeRadius: SUMO_TUNING.arenaRadius + 0.04,
  /** The column's height: the floor to the slab's underside, 0.5 alcove units in the shipped alcove. */
  rise: 1.72,
  /** The felt over the slab's underside. */
  thickness: 0.16
} as const

/** How far from the column's axis anything of the sumo reaches on the floor: a top pushed off lands and bursts inside this ring. */
export const FLOOR_REACH = 1.285
