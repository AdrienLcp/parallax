import type { Seat, SeatSlot } from '@parallax/protocol/room'

import type { PlanarVector } from '@/helpers/planar-vector'

import type { SumoMatch } from './sumo-match'
import { SUMO_TUNING } from './sumo-tuning'

/** One top as the arena draws it, in arena units. */
export type DrawnTop = {
  /** 0 while it stands on the platform, rising to 1 as it reaches the bottom of the gutter. */
  readonly fall: number
  /** Its phone went silent: the top stays on the board with nobody driving it. */
  readonly isAbsent: boolean
  /** It dashed less than a cooldown ago and cannot dash again yet. */
  readonly isDashRecharging: boolean
  readonly position: PlanarVector
  readonly slot: SeatSlot
  readonly velocity: PlanarVector
}

/** What the arena shows at one instant: the tops still on the board or on their way down. */
export type ArenaFrame = {
  readonly tops: readonly DrawnTop[]
}

const EMPTY_ARENA: ArenaFrame = { tops: [] }

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
    tops: match.round.tops.flatMap((top): DrawnTop[] => {
      const seat = seatById.get(top.seat)
      if (seat === undefined || top.status === 'out') return []
      return [
        {
          fall:
            top.status === 'falling'
              ? top.fallElapsed / SUMO_TUNING.fallSeconds
              : 0,
          isAbsent: !seat.isConnected,
          isDashRecharging: top.status === 'spinning' && top.dashCooldown > 0,
          position: top.position,
          slot: seat.slot,
          velocity: top.velocity
        }
      ]
    })
  }
}
