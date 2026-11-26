import type { DrawnTop } from './arena-frame'
import { type ArenaHeights, SHIPPED_HEIGHTS } from './arena-shape'
import { ARENA_TABLE } from './arena-table'
import { SUMO_TUNING } from './sumo-tuning'

const LEAN_PER_SPEED = 0.35
const MOST_LEAN_RADIANS = 0.3
/** The share of its fall a top spends sliding off the edge before it drops: about 0.15 s. */
const TIP_SHARE = 0.17
/** How far out a falling top lands: just clear of the table's edge, nearly straight down, so its burst has room on the floor. */
export const LANDING_RADIUS =
  ARENA_TABLE.edgeRadius + SUMO_TUNING.topRadius * 1.2
/** How far a falling top has tumbled by the time it hits the floor: past lying on its side. */
const LANDING_LEAN_RADIANS = 1.7
/** How fast a falling top's spin dies, per second of its fall. */
const SPIN_DECAY_PER_SECOND = 2.2

/** How the scene stands one top: where, which way it leans, how far, and how fast it still spins. */
export type TopPose = {
  /** The direction it leans toward, in radians around the table's axis. */
  readonly heading: number
  readonly lean: number
  /** The share of a live top's spin it keeps: 1 standing, dying as it falls. */
  readonly spinShare: number
  readonly x: number
  readonly y: number
  readonly z: number
}

/** How high over the felt a jumping top rides, `jump` into its airtime: a parabola peaking at the tuned height. */
export const hopHeightOf = (jump: number): number =>
  jump <= 0 || jump >= 1 ? 0 : SUMO_TUNING.jumpHeight * 4 * jump * (1 - jump)

/**
 * A standing top leans with its speed on the felt, and rides its hop while it
 * jumps, upright. A falling one slides out past the table's edge, then drops
 * under gravity to the alcove's floor, tumbling, its spin dying, and lands
 * at `LANDING_RADIUS` as its fall ends: there it bursts (the renderer's).
 */
export const topPoseOf = (
  { fall, jump, position, velocity }: DrawnTop,
  { surfaceHeight }: ArenaHeights = SHIPPED_HEIGHTS
): TopPose => {
  if (fall === 0) {
    const hop = hopHeightOf(jump)
    return {
      heading: Math.atan2(velocity.y, velocity.x),
      lean:
        hop > 0
          ? 0
          : Math.min(
              Math.hypot(velocity.x, velocity.y) * LEAN_PER_SPEED,
              MOST_LEAN_RADIANS
            ),
      spinShare: 1,
      x: position.x,
      y: surfaceHeight + hop,
      z: position.y
    }
  }
  const share = Math.min(1, fall)
  const slide = 1 - (1 - share) ** 3
  const drop = Math.max(0, (share - TIP_SHARE) / (1 - TIP_SHARE))
  const outward = Math.atan2(position.y, position.x)
  const reach = Math.min(Math.hypot(position.x, position.y), LANDING_RADIUS)
  const radius = reach + (LANDING_RADIUS - reach) * slide
  const startLean = MOST_LEAN_RADIANS / 2
  return {
    heading: outward,
    lean: startLean + (LANDING_LEAN_RADIANS - startLean) * share,
    spinShare: Math.exp(
      -SPIN_DECAY_PER_SECOND * share * SUMO_TUNING.fallSeconds
    ),
    x: Math.cos(outward) * radius,
    y: surfaceHeight * (1 - drop ** 2),
    z: Math.sin(outward) * radius
  }
}
