import { ARENA_TABLE } from './arena-table'
import { SUMO_TUNING } from './sumo-tuning'

/** How much taller than the physics' disc the modelled top stands, so it reads from across the room. */
const TOP_SCALE = 2

/** How tall the arena's objects stand, as multiples of the shipped table and tops. */
export type ArenaShape = {
  /** Thickens the table's slab upward from its underside: the felt rises with it, the column stays. */
  readonly drumHeightScale: number
  readonly topHeightScale: number
}

export const SHIPPED_SHAPE: ArenaShape = {
  drumHeightScale: 1,
  topHeightScale: 1
}

/** The heights the scene stands the tops on and frames, in arena units from the alcove's floor. */
export type ArenaHeights = {
  /** The felt, where a standing top's point rests. */
  readonly surfaceHeight: number
  readonly topHeight: number
}

export const heightsOf = ({
  drumHeightScale,
  topHeightScale
}: ArenaShape): ArenaHeights => ({
  surfaceHeight: ARENA_TABLE.rise + ARENA_TABLE.thickness * drumHeightScale,
  topHeight: SUMO_TUNING.topRadius * 1.2 * TOP_SCALE * topHeightScale
})

export const SHIPPED_HEIGHTS = heightsOf(SHIPPED_SHAPE)
