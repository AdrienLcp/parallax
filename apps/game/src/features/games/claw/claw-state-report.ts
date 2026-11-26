import type { ClawState } from '@parallax/protocol/claw'

import type { ClawMatchView } from './claw-match'
import type { ClawPit } from './claw-pit'
import { CLAW_TUNING } from './claw-tuning'

/** A share of a span, from -1 to 1, rounded so a still claw reports the same. */
const shareOf = (value: number, min: number, max: number): number => {
  const share = ((value - min) / (max - min)) * 2 - 1
  return Math.round(Math.min(1, Math.max(-1, share)) * 50) / 50
}

/** What the phones are told of the game: the clock, each seat's score, what its claw does and where, who won. */
export const reportedState = ({
  pit,
  view
}: {
  pit: ClawPit
  view: ClawMatchView | null
}): ClawState => {
  if (view === null) {
    return {
      phase: 'lobby',
      seats: [],
      secondsLeft: CLAW_TUNING.roundSeconds,
      type: 'claw.state',
      winners: []
    }
  }
  const { reach } = pit
  return {
    phase: view.outcome === null ? 'playing' : 'decided',
    seats: view.claws.map((claw) => ({
      activity: claw.phase === 'aim' ? 'aiming' : 'busy',
      score: claw.score,
      seatId: claw.seat,
      x: shareOf(claw.x, reach.minX, reach.maxX),
      z: shareOf(claw.z, reach.minZ, reach.maxZ)
    })),
    secondsLeft: Math.max(
      0,
      Math.ceil(CLAW_TUNING.roundSeconds - view.elapsed)
    ),
    type: 'claw.state',
    winners: [...(view.outcome?.winners ?? [])]
  }
}
