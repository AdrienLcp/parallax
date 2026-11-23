import type { SeatId } from '@parallax/protocol/identifiers'

import {
  added,
  clampedLength,
  dot,
  lengthOf,
  normalized,
  ORIGIN,
  type PlanarVector,
  scaled,
  subtracted
} from '@/helpers/planar-vector'

import type { SpinningTop, SumoControl, Top } from './sumo-physics'

/** How far a demo top tilts its stick: at full tilt nearly every round ends with the last tops falling together. */
export const BOT_STICK_MAGNITUDE = 0.45

/** The farthest from the centre a demo top heads for: close enough to the edge that a bump can send it off. */
export const BOT_WANDER_REACH = 0.8

/** A demo top this close to where it heads lets go of its stick. */
const ARRIVED_DISTANCE = 0.03

/** A rival within this distance, in front of a demo top, is worth a dash. */
const DASH_REACH = 0.5

/** How squarely in front a rival must be: the cosine of the widest angle. */
const DASH_AIM = 0.8

/** The chance, per second spent with a rival in front, that a demo top dashes: rare enough to read. */
const DASH_CHANCE_PER_SECOND = 0.8

/** How slowly a demo top swings between wandering and hunting, in radians per second. */
const MOOD_RATE = 0.45

/** A demo top in a hunting mood goes after the nearest rival within this distance. */
const HUNT_REACH = 1.4

/** A hunting demo top aims this far past its rival, away from the centre, to push it toward the gutter. */
const PUSH_THROUGH = 0.5

/** The farthest a hunting demo top aims: short of the edge, so it rarely follows its rival off. */
const HUNT_TARGET_REACH = 0.95

/**
 * Where a demo top heads at `clock` seconds: a slow loop of its own over the
 * arena, set apart from the others' by its `phase`, never past the wander reach.
 */
export const wanderTargetOf = ({
  clock,
  phase
}: {
  clock: number
  phase: number
}): PlanarVector =>
  clampedLength(
    {
      x: Math.sin(clock * 0.37 + phase * 1.7) * Math.cos(clock * 0.11 + phase),
      y: Math.sin(clock * 0.29 + phase * 2.3)
    },
    BOT_WANDER_REACH
  )

/** The stick that steers a top from `position` toward `target`, at the demo's tilt. */
export const botStickToward = ({
  position,
  target
}: {
  position: PlanarVector
  target: PlanarVector
}): PlanarVector => {
  const toTarget = subtracted(target, position)
  return lengthOf(toTarget) <= ARRIVED_DISTANCE
    ? ORIGIN
    : scaled(normalized(toTarget), BOT_STICK_MAGNITUDE)
}

/**
 * Whether a demo top dashes on this step: only once recharged, only at a rival
 * close in front of where it heads, and then only by chance (`roll`, in [0, 1)).
 */
export const botDashes = ({
  roll,
  rivals,
  seconds,
  stick,
  top
}: {
  roll: number
  rivals: readonly Top[]
  seconds: number
  stick: PlanarVector
  top: SpinningTop
}): boolean => {
  if (top.dashCooldown > 0 || stick === ORIGIN) return false
  const heading = normalized(stick)
  const hasRivalInFront = rivals.some((rival) => {
    if (rival.status !== 'spinning' || rival.seat === top.seat) return false
    const toRival = subtracted(rival.position, top.position)
    const distance = lengthOf(toRival)
    return (
      distance > 0 &&
      distance <= DASH_REACH &&
      dot(toRival, heading) / distance >= DASH_AIM
    )
  })
  return hasRivalInFront && roll < DASH_CHANCE_PER_SECOND * seconds
}

const isHunting = ({ clock, phase }: { clock: number; phase: number }) =>
  Math.sin(clock * MOOD_RATE + phase * 2.1) > 0

const nearestRivalOf = (
  top: SpinningTop,
  rivals: readonly Top[]
): PlanarVector | null => {
  let nearest: PlanarVector | null = null
  let nearestDistance = HUNT_REACH
  for (const rival of rivals) {
    if (rival.status !== 'spinning' || rival.seat === top.seat) continue
    const distance = lengthOf(subtracted(rival.position, top.position))
    if (distance <= nearestDistance) {
      nearest = clampedLength(
        added(rival.position, scaled(normalized(rival.position), PUSH_THROUGH)),
        HUNT_TARGET_REACH
      )
      nearestDistance = distance
    }
  }
  return nearest
}

/**
 * Where a demo top heads on this step: in a hunting mood, at the nearest
 * rival in reach; otherwise, along its own wander loop.
 */
export const botTargetOf = ({
  clock,
  phase,
  rivals,
  top
}: {
  clock: number
  phase: number
  rivals: readonly Top[]
  top: SpinningTop
}): PlanarVector =>
  (isHunting({ clock, phase }) ? nearestRivalOf(top, rivals) : null) ??
  wanderTargetOf({ clock, phase })

/** What every demo top asks of the arena on one step: its stick, and whether it dashes. */
export const botInputsOf = ({
  clock,
  phaseOf,
  random,
  seconds,
  tops
}: {
  clock: number
  /** Each seat's own wander loop. */
  phaseOf: (seat: SeatId) => number
  /** Draws a number in [0, 1): `Math.random` in the showcase, a fixed sequence in tests. */
  random: () => number
  seconds: number
  tops: readonly Top[]
}): { controls: Map<SeatId, SumoControl>; dashes: Set<SeatId> } => {
  const controls = new Map<SeatId, SumoControl>()
  const dashes = new Set<SeatId>()
  for (const top of tops) {
    if (top.status !== 'spinning') continue
    const stick = botStickToward({
      position: top.position,
      target: botTargetOf({
        clock,
        phase: phaseOf(top.seat),
        rivals: tops,
        top
      })
    })
    controls.set(top.seat, { stick })
    if (botDashes({ rivals: tops, roll: random(), seconds, stick, top })) {
      dashes.add(top.seat)
    }
  }
  return { controls, dashes }
}
