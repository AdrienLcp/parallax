import { ARENA_DRUM, DITCH_FLOOR, DRUM_LIP_TOP } from './arena-drum'
import { SUMO_TUNING } from './sumo-tuning'

/** How much taller than the physics' disc the modelled top stands, so it reads from across the room. */
const TOP_SCALE = 2

/** How tall the arena's objects stand, as multiples of the shipped drum and tops. */
export type ArenaShape = {
  /** Stretches the drum upward from the alcove's floor: its felt, ditch and lip rise with it. */
  readonly drumHeightScale: number
  readonly topHeightScale: number
}

export const SHIPPED_SHAPE: ArenaShape = {
  drumHeightScale: 1,
  topHeightScale: 1
}

/** The heights the scene stands the tops on and frames, in arena units from the alcove's floor. */
export type ArenaHeights = {
  readonly ditchFloor: number
  readonly lipTop: number
  readonly surfaceHeight: number
  readonly topHeight: number
}

export const heightsOf = ({
  drumHeightScale,
  topHeightScale
}: ArenaShape): ArenaHeights => ({
  ditchFloor: DITCH_FLOOR * drumHeightScale,
  lipTop: DRUM_LIP_TOP * drumHeightScale,
  surfaceHeight: ARENA_DRUM.surfaceHeight * drumHeightScale,
  topHeight: SUMO_TUNING.topRadius * 1.2 * TOP_SCALE * topHeightScale
})

export const SHIPPED_HEIGHTS = heightsOf(SHIPPED_SHAPE)
