import type { SeatId } from '@parallax/protocol/identifiers'

import type { SumoStep, Top } from './sumo-physics'
import {
  advanceRound,
  matchWinnerOf,
  type SumoRound,
  startRound,
  tallied,
  withoutLeftSeats
} from './sumo-round'
import { SUMO_PLAYERS, SUMO_TUNING } from './sumo-tuning'

/**
 * The match the screen runs: the room gathers until every present phone is
 * ready, then rounds follow one another, among the seats that started the
 * match, until one reaches the winning tally; then the room gathers again.
 */
export type SumoMatch =
  | { readonly stage: 'gathering' }
  | {
      /** Seconds since the round was decided; 0 while it is still on. */
      readonly decidedFor: number
      readonly round: SumoRound
      /** 1 for the match's first round. */
      readonly roundNumber: number
      readonly stage: 'playing'
      readonly wins: ReadonlyMap<SeatId, number>
    }

export const GATHERING: SumoMatch = { stage: 'gathering' }

export type SumoMatchStep = Omit<SumoStep, 'tops'> & {
  /** Seats whose phone is connected, in seating order: who the next round takes. */
  readonly present: readonly SeatId[]
  /** Seats whose player is ready for the next match: a match starts once every present one is. */
  readonly ready: ReadonlySet<SeatId>
  /** Every seat the room still holds, phone or not: a top whose seat is gone leaves the round. */
  readonly seated: ReadonlySet<SeatId>
}

const NO_WINS: ReadonlyMap<SeatId, number> = new Map()

const roundOrGathering = ({
  players,
  roundNumber,
  wins
}: {
  players: readonly SeatId[]
  roundNumber: number
  wins: ReadonlyMap<SeatId, number>
}): SumoMatch =>
  players.length >= SUMO_PLAYERS.fewest
    ? {
        decidedFor: 0,
        round: startRound(players.slice(0, SUMO_PLAYERS.most)),
        roundNumber,
        stage: 'playing',
        wins
      }
    : GATHERING

/** An absent phone never holds the room back: only the present ones have to be ready. */
const isEveryoneReady = ({
  present,
  ready
}: Pick<SumoMatchStep, 'present' | 'ready'>): boolean =>
  present.length >= SUMO_PLAYERS.fewest &&
  present.every((seat) => ready.has(seat))

export const advanceMatch = (
  match: SumoMatch,
  { present, ready, seated, ...step }: SumoMatchStep
): SumoMatch => {
  if (match.stage === 'gathering') {
    return isEveryoneReady({ present, ready })
      ? roundOrGathering({ players: present, roundNumber: 1, wins: NO_WINS })
      : GATHERING
  }

  if (match.round.phase !== 'decided') {
    const round = advanceRound(withoutLeftSeats(match.round, seated), step)
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

  if (isMatchOver) {
    return GATHERING
  }

  const stillPresent = new Set(present)

  return roundOrGathering({
    players: match.round.tops
      .map((top) => top.seat)
      .filter((seat) => stillPresent.has(seat)),
    roundNumber: match.roundNumber + 1,
    wins: match.wins
  })
}

/** The step that took the room from gathering to a match: the moment its ready marks are spent. */
export const hasMatchStarted = ({
  next,
  previous
}: {
  next: SumoMatch
  previous: SumoMatch
}): boolean => previous.stage === 'gathering' && next.stage === 'playing'

/** The step that took the room from a match back to gathering: over, or short of players. */
export const hasMatchEnded = ({
  next,
  previous
}: {
  next: SumoMatch
  previous: SumoMatch
}): boolean => previous.stage === 'playing' && next.stage === 'gathering'

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
