import type { SeatId } from '@parallax/protocol/identifiers'

import type { SumoStep, Top } from './sumo-physics'
import {
  advanceRound,
  matchWinnerOf,
  type SumoRound,
  startRound,
  tallied
} from './sumo-round'
import { SUMO_PLAYERS, SUMO_TUNING } from './sumo-tuning'

/**
 * The match the screen runs: the room gathers until enough phones are present,
 * then rounds follow one another until a seat reaches the winning tally, and a
 * new match starts with whoever is still there.
 */
export type SumoMatch =
  | { readonly stage: 'gathering' }
  | {
      /** Seconds since the round was decided; 0 while it is still on. */
      readonly decidedFor: number
      readonly round: SumoRound
      readonly stage: 'playing'
      readonly wins: ReadonlyMap<SeatId, number>
    }

export const GATHERING: SumoMatch = { stage: 'gathering' }

export type SumoMatchStep = Omit<SumoStep, 'tops'> & {
  /** Seats whose phone is connected, in seating order: who the next round takes. */
  readonly present: readonly SeatId[]
}

const NO_WINS: ReadonlyMap<SeatId, number> = new Map()

const nextRoundOrGathering = ({
  present,
  wins
}: {
  present: readonly SeatId[]
  wins: ReadonlyMap<SeatId, number>
}): SumoMatch =>
  present.length >= SUMO_PLAYERS.fewest
    ? {
        decidedFor: 0,
        round: startRound(present.slice(0, SUMO_PLAYERS.most)),
        stage: 'playing',
        wins
      }
    : GATHERING

export const advanceMatch = (
  match: SumoMatch,
  { present, ...step }: SumoMatchStep
): SumoMatch => {
  if (match.stage === 'gathering') {
    return nextRoundOrGathering({ present, wins: NO_WINS })
  }

  if (match.round.phase !== 'decided') {
    const round = advanceRound(match.round, step)
    return { ...match, round, wins: tallied({ round, wins: match.wins }) }
  }

  const decidedFor = match.decidedFor + step.seconds
  const isMatchOver = matchWinnerOf(match.wins) !== null
  const pause = isMatchOver
    ? SUMO_TUNING.matchPauseSeconds
    : SUMO_TUNING.roundPauseSeconds

  if (decidedFor < pause) {
    return { ...match, decidedFor }
  }

  return nextRoundOrGathering({
    present,
    wins: isMatchOver ? NO_WINS : match.wins
  })
}

const topsOf = (match: SumoMatch): readonly Top[] =>
  match.stage === 'playing' ? match.round.tops : []

/** Seats whose top left the platform between two consecutive steps. */
export const ejectedBetween = ({
  next,
  previous
}: {
  next: SumoMatch
  previous: SumoMatch
}): SeatId[] => {
  const wasSpinning = new Set(
    topsOf(previous)
      .filter((top) => top.status === 'spinning')
      .map((top) => top.seat)
  )
  return topsOf(next)
    .filter((top) => top.status === 'falling' && wasSpinning.has(top.seat))
    .map((top) => top.seat)
}

/** The whole seconds left before the fight, or `null` when no countdown runs. */
export const countdownShown = (match: SumoMatch): number | null =>
  match.stage === 'playing' && match.round.phase === 'countdown'
    ? Math.ceil(match.round.remaining)
    : null
