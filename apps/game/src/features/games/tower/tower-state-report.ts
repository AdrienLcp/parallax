import type { TowerRule, TowerState } from '@parallax/protocol/tower'

import { heightCm, type TowerMatchView } from './tower-match'

/** What the phones are told of the game: whose turn, each seat's block and height, who toppled what. */
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

  return {
    phase:
      outcome !== null
        ? 'decided'
        : isSettling && shared !== undefined
          ? 'settling'
          : 'aiming',
    rule: view.rule,
    seats: lanes.flatMap((lane) =>
      lane.seats.map((seatId) => ({
        heightCm: heightCm(lane.height),
        nextBlock:
          outcome !== null
            ? null
            : lane.floating?.seat === seatId
              ? lane.floating.kind
              : view.rule === 'race'
                ? lane.next
                : null,
        seatId,
        toppled:
          view.rule === 'shared'
            ? outcome?.kind === 'toppled' && outcome.seat === seatId
            : lane.toppled > 0
      }))
    ),
    turnSeatId,
    type: 'tower.state'
  }
}
