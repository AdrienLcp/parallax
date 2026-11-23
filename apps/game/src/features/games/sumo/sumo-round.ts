import type { SeatId } from '@parallax/protocol/identifiers'

import { ORIGIN } from '@/helpers/planar-vector'

import { roundMarksOf } from './round-marks'
import { type SumoStep, stepTops, type Top } from './sumo-physics'
import { SUMO_TUNING } from './sumo-tuning'

/**
 * One round on the arena: a countdown while the tops wait on their marks, the
 * fight, then the round decided once at most one top still spins.
 */
export type SumoRound =
  | {
      readonly phase: 'countdown'
      readonly remaining: number
      readonly tops: readonly Top[]
    }
  | { readonly phase: 'fighting'; readonly tops: readonly Top[] }
  | {
      readonly phase: 'decided'
      readonly tops: readonly Top[]
      /** `null` when the last tops fell together. */
      readonly winner: SeatId | null
    }

/** Places each seat on its mark around the centre, in seating order. */
export const startRound = (seats: readonly SeatId[]): SumoRound => {
  const marks = roundMarksOf(seats.length)
  return {
    phase: 'countdown',
    remaining: SUMO_TUNING.countdownSeconds,
    tops: seats.map((seat, index) => ({
      dashCooldown: 0,
      lastContact: null,
      position: marks[index] ?? ORIGIN,
      seat,
      status: 'spinning',
      velocity: ORIGIN
    }))
  }
}

const decidedOrFighting = (tops: readonly Top[]): SumoRound => {
  const spinning = tops.filter((top) => top.status === 'spinning')
  const isAnyFalling = tops.some((top) => top.status === 'falling')
  if (spinning.length > 1 || isAnyFalling) return { phase: 'fighting', tops }
  return { phase: 'decided', tops, winner: spinning[0]?.seat ?? null }
}

export const advanceRound = (
  round: SumoRound,
  input: Omit<SumoStep, 'tops'>
): SumoRound => {
  switch (round.phase) {
    case 'countdown': {
      const remaining = round.remaining - input.seconds
      return remaining > 0
        ? { ...round, remaining }
        : { phase: 'fighting', tops: round.tops }
    }
    case 'fighting':
      return decidedOrFighting(stepTops({ ...input, tops: round.tops }))
    case 'decided':
      return round
    default:
      return round satisfies never
  }
}

/** A seat gone from the room takes its top along: nobody would see it, everyone would bump into it. */
export const withoutLeftSeats = (
  round: SumoRound,
  seated: ReadonlySet<SeatId>
): SumoRound =>
  round.tops.every((top) => seated.has(top.seat))
    ? round
    : { ...round, tops: round.tops.filter((top) => seated.has(top.seat)) }

/** The tally after a decided round: the winner takes one. */
export const tallied = ({
  round,
  wins
}: {
  round: SumoRound
  wins: ReadonlyMap<SeatId, number>
}): ReadonlyMap<SeatId, number> => {
  if (round.phase !== 'decided' || round.winner === null) return wins
  return new Map(wins).set(round.winner, (wins.get(round.winner) ?? 0) + 1)
}

/** The seat that reached the winning tally, or `null` while the match goes on. */
export const matchWinnerOf = (
  wins: ReadonlyMap<SeatId, number>
): SeatId | null =>
  [...wins].find(([, count]) => count >= SUMO_TUNING.roundsToWin)?.[0] ?? null
