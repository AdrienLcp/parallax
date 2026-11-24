import { TOP_HEIGHT } from './arena-camera'
import { ARENA_DRUM, DITCH_FLOOR, DITCH_REST_RADIUS } from './arena-drum'
import type { DrawnTop } from './arena-frame'
import { SUMO_TUNING } from './sumo-tuning'

const LEAN_PER_SPEED = 0.35
const MOST_LEAN_RADIANS = 0.3
/** A falling top reaches the ditch's floor this far into its fall, then lies there. */
const DROP_SHARE_OF_FALL = 0.55 / SUMO_TUNING.fallSeconds
/** How fast a fallen top's spin dies, per second of its fall. */
const SPIN_DECAY_PER_SECOND = 2.2
/** The lean at which a top lies on its side, its point and its ring on the ditch's floor. */
export const LYING_LEAN_RADIANS = Math.atan2(
  0.8 * TOP_HEIGHT,
  SUMO_TUNING.topRadius
)

/** How the scene stands one top: where, which way it leans, how far, and how fast it still spins. */
export type TopPose = {
  /** The direction it leans toward, in radians around the drum's axis. */
  readonly heading: number
  readonly lean: number
  /** The share of a live top's spin it keeps: 1 standing, dying to nothing in the ditch. */
  readonly spinShare: number
  readonly x: number
  readonly y: number
  readonly z: number
}

/**
 * A standing top leans with its speed on the felt. A falling one slides
 * outward to the middle of the ditch, drops to its floor and lies down along
 * it, its spin dying, whatever its course past the rim: the top is wider than
 * the ditch, so lying across it would sink it into the lip.
 */
export const topPoseOf = ({ fall, position, velocity }: DrawnTop): TopPose => {
  if (fall === 0) {
    return {
      heading: Math.atan2(velocity.y, velocity.x),
      lean: Math.min(
        Math.hypot(velocity.x, velocity.y) * LEAN_PER_SPEED,
        MOST_LEAN_RADIANS
      ),
      spinShare: 1,
      x: position.x,
      y: ARENA_DRUM.surfaceHeight,
      z: position.y
    }
  }
  const drop = Math.min(1, fall / DROP_SHARE_OF_FALL)
  const slide = 1 - (1 - drop) ** 3
  const outward = Math.atan2(position.y, position.x)
  const reach = Math.hypot(position.x, position.y)
  const radius = reach + (DITCH_REST_RADIUS - reach) * slide
  const startLean = MOST_LEAN_RADIANS / 2
  return {
    heading: outward + Math.PI / 2,
    lean:
      startLean + (LYING_LEAN_RADIANS - startLean) * Math.min(1, drop * 1.15),
    spinShare: Math.exp(
      -SPIN_DECAY_PER_SECOND * fall * SUMO_TUNING.fallSeconds
    ),
    x: Math.cos(outward) * radius,
    y:
      ARENA_DRUM.surfaceHeight +
      (DITCH_FLOOR - ARENA_DRUM.surfaceHeight) * drop ** 2,
    z: Math.sin(outward) * radius
  }
}
