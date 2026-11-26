import type { TowerRule, TowerState } from '@parallax/protocol/tower'

import {
  heightCm,
  scoreOf,
  secondsLeftOf,
  type TowerMatchView
} from './tower-match'
import { TOWER_TUNING } from './tower-tuning'

/** What the phones are told of the game: whose turn, each seat's blocks on offer, its score and height, who won. */
export const reportedState = ({
  rule,
  view
}: {
  rule: TowerRule
  view: TowerMatchView | null
}): TowerState => {
  if (view === null) {
    return {
      phase: 'lobby',
      rule,
      seats: [],
      turnSeatId: null,
      turns: { of: TOWER_TUNING.blocksEach, played: 0 },
      type: 'tower.state'
    }
  }
  const { lanes, outcome } = view
  const isSettling = lanes.some((lane) => lane.settling !== null)
  const shared = view.rule === 'shared' ? lanes[0] : undefined
  const turnSeatId =
    shared === undefined || outcome !== null
      ? null
      : (shared.floating?.seat ?? null)
  const hasWon = (seatId: string): boolean =>
    outcome?.kind === 'ceiling'
      ? outcome.seats.includes(seatId)
      : outcome != null && outcome.seat === seatId

  return {
    phase:
      outcome !== null
        ? 'decided'
        : isSettling && shared !== undefined
          ? 'settling'
          : 'aiming',
    rule: view.rule,
    seats: lanes.flatMap((lane) =>
      lane.seats.map((seatId) => {
        const floating =
          outcome === null && lane.floating?.seat === seatId
            ? lane.floating
            : null
        return {
          heightCm: heightCm(lane.height),
          offer:
            floating === null
              ? null
              : {
                  blocks: [floating.offer[0], floating.offer[1]],
                  choice: floating.choice
                },
          score: view.rule === 'shared' ? scoreOf(lane, seatId) : 0,
          seatId,
          secondsLeft:
            floating === null ? null : Math.ceil(secondsLeftOf(floating)),
          won: hasWon(seatId)
        }
      })
    ),
    turnSeatId,
    turns: {
      of: TOWER_TUNING.blocksEach,
      played: Math.max(0, ...(shared?.played.values() ?? []))
    },
    type: 'tower.state'
  }
}
