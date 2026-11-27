import type { GlobeState } from '@parallax/protocol/globe'

import type { GlobeView } from './globe-match'

/** What the phones are told of the game: whose turn, the place, the clock, the last pin, each seat's score. */
export const reportedState = (view: GlobeView | null): GlobeState => {
  if (view === null) {
    return {
      phase: 'lobby',
      place: null,
      result: null,
      seats: [],
      secondsLeft: null,
      turnSeatId: null,
      turns: { of: 0, played: 0 },
      type: 'globe.state'
    }
  }
  const { outcome, result, turn } = view
  return {
    phase: view.phase,
    place:
      turn !== null
        ? { id: turn.place.id, kind: turn.place.kind }
        : result !== null
          ? { id: result.place.id, kind: result.place.kind }
          : null,
    result:
      result === null
        ? null
        : {
            km: Math.round(result.km),
            points: result.points,
            seatId: result.seat
          },
    seats: [...view.scores].map(([seatId, score]) => ({
      score,
      seatId,
      won: outcome?.winners.includes(seatId) ?? false
    })),
    secondsLeft: turn === null ? null : Math.ceil(turn.secondsLeft),
    turnSeatId: turn?.seat ?? result?.seat ?? null,
    turns: view.turns,
    type: 'globe.state'
  }
}
