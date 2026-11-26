import type { Seat, SeatSlot } from '@parallax/protocol/room'

import type { PlanarVector } from '@/helpers/planar-vector'

import type { SumoMatch } from './sumo-match'
import type { Top } from './sumo-physics'
import { SUMO_TUNING } from './sumo-tuning'

/** One top as the arena draws it, in arena units. */
export type DrawnTop = {
  /** 0 while it stands on the table, rising to 1 as it falls to the floor, and 1 once out: it has burst. */
  readonly fall: number
  /** Its phone went silent: the top stays on the board with nobody driving it. */
  readonly isAbsent: boolean
  /** It dashed less than a cooldown ago and cannot dash again yet. */
  readonly isDashRecharging: boolean
  /** The share of its airtime a jumping top has spent, 0 on the felt. */
  readonly jump: number
  readonly position: PlanarVector
  readonly slot: SeatSlot
  readonly velocity: PlanarVector
}

/** What the arena shows at one instant: the tops on the felt or in the air, on their way down, or burst on the floor. */
export type ArenaFrame = {
  readonly tops: readonly DrawnTop[]
}

const EMPTY_ARENA: ArenaFrame = { tops: [] }

const STILL = { x: 0, y: 0 }

/** How the arena draws one top of a round: once out, it has burst on the floor and is gone until the next round. */
export const drawnTopOf = ({
  isAbsent,
  slot,
  top
}: {
  isAbsent: boolean
  slot: SeatSlot
  top: Top
}): DrawnTop =>
  top.status === 'out'
    ? {
        fall: 1,
        isAbsent,
        isDashRecharging: false,
        jump: 0,
        position: top.position,
        slot,
        velocity: STILL
      }
    : {
        fall:
          top.status === 'falling'
            ? top.fallElapsed / SUMO_TUNING.fallSeconds
            : 0,
        isAbsent,
        isDashRecharging: top.status === 'spinning' && top.dashCooldown > 0,
        jump:
          top.status === 'spinning' && top.jumpElapsed !== null
            ? top.jumpElapsed / SUMO_TUNING.jumpAirSeconds
            : 0,
        position: top.position,
        slot,
        velocity: top.velocity
      }

export const arenaFrameOf = ({
  match,
  seats
}: {
  match: SumoMatch
  seats: readonly Seat[]
}): ArenaFrame => {
  if (match.stage === 'gathering') {
    return EMPTY_ARENA
  }

  const seatById = new Map(seats.map((seat) => [seat.seatId, seat]))

  return {
    tops: match.round.tops.flatMap((top) => {
      const seat = seatById.get(top.seat)
      return seat === undefined
        ? []
        : [drawnTopOf({ isAbsent: !seat.isConnected, slot: seat.slot, top })]
    })
  }
}
