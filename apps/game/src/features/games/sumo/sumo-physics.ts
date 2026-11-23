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

import { SUMO_TUNING } from './sumo-tuning'

/** The last top this one touched, and how long ago. */
export type TopContact = {
  readonly seat: SeatId
  readonly since: number
}

/** One player's top. Only a spinning top is driven and collides. */
export type Top =
  | {
      readonly dashCooldown: number
      readonly lastContact: TopContact | null
      readonly position: PlanarVector
      readonly seat: SeatId
      readonly status: 'spinning'
      readonly velocity: PlanarVector
    }
  | {
      readonly fallElapsed: number
      /** The seat credited with the push, `null` when the top drove itself off. */
      readonly outBy: SeatId | null
      readonly position: PlanarVector
      readonly seat: SeatId
      readonly status: 'falling'
      readonly velocity: PlanarVector
    }
  | {
      readonly outBy: SeatId | null
      readonly position: PlanarVector
      readonly seat: SeatId
      readonly status: 'out'
    }

export type SpinningTop = Extract<Top, { status: 'spinning' }>

/** What a phone asks of its top: the stick inside the unit disc. */
export type SumoControl = {
  readonly stick: PlanarVector
}

export type SumoStep = {
  /** Seats whose dash arrived since the previous step. */
  readonly dashes: ReadonlySet<SeatId>
  readonly controls: ReadonlyMap<SeatId, SumoControl>
  readonly seconds: number
  readonly tops: readonly Top[]
}

const dashDirection = (top: SpinningTop, stick: PlanarVector): PlanarVector => {
  const aimed = normalized(stick)
  return aimed === ORIGIN ? normalized(top.velocity) : aimed
}

const driven = (
  top: SpinningTop,
  { controls, dashes, seconds }: Omit<SumoStep, 'tops'>
): SpinningTop => {
  const stick = clampedLength(controls.get(top.seat)?.stick ?? ORIGIN, 1)
  const canDrive = lengthOf(top.velocity) < SUMO_TUNING.maximumDriveSpeed
  const accelerated = canDrive
    ? added(
        top.velocity,
        scaled(stick, SUMO_TUNING.driveAcceleration * seconds)
      )
    : top.velocity
  const slowed = scaled(accelerated, Math.exp(-SUMO_TUNING.friction * seconds))
  const cooldown = Math.max(0, top.dashCooldown - seconds)
  const isDashing = dashes.has(top.seat) && cooldown === 0
  const velocity = isDashing
    ? added(slowed, scaled(dashDirection(top, stick), SUMO_TUNING.dashImpulse))
    : slowed

  return {
    ...top,
    dashCooldown: isDashing ? SUMO_TUNING.dashCooldownSeconds : cooldown,
    lastContact:
      top.lastContact === null
        ? null
        : { ...top.lastContact, since: top.lastContact.since + seconds },
    position: added(top.position, scaled(velocity, seconds)),
    velocity
  }
}

/**
 * Pushes two overlapping tops apart and exchanges their momentum along the
 * line between their centres: equal masses, slightly lossy. Each remembers
 * the other as its last contact.
 */
export const collided = ({
  first,
  second
}: {
  first: SpinningTop
  second: SpinningTop
}): [SpinningTop, SpinningTop] => {
  const between = subtracted(second.position, first.position)
  const distance = lengthOf(between)
  const reach = SUMO_TUNING.topRadius * 2
  if (distance >= reach) return [first, second]

  const normal = distance === 0 ? { x: 1, y: 0 } : scaled(between, 1 / distance)
  const separation = scaled(normal, (reach - distance) / 2)
  const closingSpeed = dot(subtracted(first.velocity, second.velocity), normal)
  const exchange =
    closingSpeed > 0
      ? scaled(normal, ((1 + SUMO_TUNING.restitution) * closingSpeed) / 2)
      : ORIGIN

  return [
    {
      ...first,
      lastContact: { seat: second.seat, since: 0 },
      position: subtracted(first.position, separation),
      velocity: subtracted(first.velocity, exchange)
    },
    {
      ...second,
      lastContact: { seat: first.seat, since: 0 },
      position: added(second.position, separation),
      velocity: added(second.velocity, exchange)
    }
  ]
}

const withCollisions = (tops: readonly SpinningTop[]): SpinningTop[] => {
  const resolved = [...tops]
  for (let firstIndex = 0; firstIndex < resolved.length; firstIndex++) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < resolved.length;
      secondIndex++
    ) {
      const first = resolved[firstIndex]
      const second = resolved[secondIndex]
      if (first === undefined || second === undefined) continue
      const [movedFirst, movedSecond] = collided({ first, second })
      resolved[firstIndex] = movedFirst
      resolved[secondIndex] = movedSecond
    }
  }
  return resolved
}

const isOverTheEdge = (position: PlanarVector): boolean =>
  lengthOf(position) > SUMO_TUNING.arenaRadius

const pusherOf = (top: SpinningTop): SeatId | null =>
  top.lastContact !== null &&
  top.lastContact.since <= SUMO_TUNING.pushCreditSeconds
    ? top.lastContact.seat
    : null

const settled = (top: SpinningTop): Top =>
  isOverTheEdge(top.position)
    ? {
        fallElapsed: 0,
        outBy: pusherOf(top),
        position: top.position,
        seat: top.seat,
        status: 'falling',
        velocity: top.velocity
      }
    : top

const fallen = (top: Top, seconds: number): Top => {
  if (top.status !== 'falling') return top
  const fallElapsed = top.fallElapsed + seconds
  if (fallElapsed >= SUMO_TUNING.fallSeconds) {
    return {
      outBy: top.outBy,
      position: top.position,
      seat: top.seat,
      status: 'out'
    }
  }
  return {
    ...top,
    fallElapsed,
    position: added(top.position, scaled(top.velocity, seconds))
  }
}

/** Advances every top by `seconds`: drive, dash, collide, then fall off the edge. */
export const stepTops = ({ tops, ...input }: SumoStep): Top[] => {
  const spinning = withCollisions(
    tops
      .filter((top) => top.status === 'spinning')
      .map((top) => driven(top, input))
  )
  const bySeat = new Map(spinning.map((top) => [top.seat, settled(top)]))
  return tops.map((top) => bySeat.get(top.seat) ?? fallen(top, input.seconds))
}
