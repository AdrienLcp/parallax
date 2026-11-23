import type { SeatId } from '@parallax/protocol/identifiers'
import type { SumoState } from '@parallax/protocol/sumo'

import { SUMO_TUNING } from './sumo-tuning'

/**
 * What a phone shows of the sumo:
 * - `lobby` — no round on the arena for this seat yet: waiting, the stick free
 * - `playing` — its top spins in a round
 * - `out` — its top went to the gutter this round
 * - `roundWon` — the round is decided and its top is the last one spinning
 * - `matchWon` — that round was the one that won the match
 */
export type SumoControllerView =
  | 'lobby'
  | 'matchWon'
  | 'out'
  | 'playing'
  | 'roundWon'

/** The view for `seatId`, from the last state the screen sent (`null` before the first). */
export const sumoControllerView = ({
  seatId,
  state
}: {
  seatId: SeatId
  state: SumoState | null
}): SumoControllerView => {
  if (state === null || state.phase === 'lobby') {
    return 'lobby'
  }

  const ownTop = state.tops.find((top) => top.seatId === seatId)

  if (ownTop === undefined) {
    return 'lobby'
  }

  if (ownTop.status === 'out') {
    return 'out'
  }

  if (state.phase !== 'decided') {
    return 'playing'
  }

  return ownTop.roundsWon >= SUMO_TUNING.roundsToWin ? 'matchWon' : 'roundWon'
}
