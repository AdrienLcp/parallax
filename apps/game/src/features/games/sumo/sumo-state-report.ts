import type { SumoState } from '@parallax/protocol/sumo'

import type { SumoMatch } from './sumo-match'

/** What the phones are told of the match: each seat in the round, whether it still spins, its tally. */
export const reportedState = (match: SumoMatch): SumoState => {
  if (match.stage === 'gathering') {
    return { phase: 'lobby', tops: [], type: 'sumo.state' }
  }

  return {
    phase: match.round.phase,
    tops: match.round.tops.map((top) => ({
      roundsWon: match.wins.get(top.seat) ?? 0,
      seatId: top.seat,
      status: top.status === 'spinning' ? 'spinning' : 'out'
    })),
    type: 'sumo.state'
  }
}
