import type { SeatId } from '@parallax/protocol/identifiers'

import type { SumoMatch } from './sumo-match'
import { matchWinnerOf } from './sumo-round'

/** Falls closer together than this read as one: "Ochre and Green in the gutter". */
const EJECTION_MERGE_SECONDS = 0.4

/** How long the room reads an ejection before the header comes back. */
const EJECTION_READING_SECONDS = 2.2

/** The falls the room is reading, and how long they have been shown. */
export type ShownEjection = {
  readonly age: number
  readonly seats: readonly SeatId[]
}

/** Adds the seats that just fell to the falls on show, or starts a new reading. */
export const withEjected = ({
  ejected,
  shown
}: {
  ejected: readonly SeatId[]
  shown: ShownEjection | null
}): ShownEjection | null => {
  if (ejected.length === 0) {
    return shown
  }

  const isMerged = shown !== null && shown.age < EJECTION_MERGE_SECONDS
  return { age: 0, seats: isMerged ? [...shown.seats, ...ejected] : ejected }
}

/** The falls on show a step later, or `null` once they have been read. */
export const agedEjection = ({
  seconds,
  shown
}: {
  seconds: number
  shown: ShownEjection | null
}): ShownEjection | null => {
  if (shown === null) {
    return null
  }

  const age = shown.age + seconds
  return age < EJECTION_READING_SECONDS ? { ...shown, age } : null
}

export type SumoAnnouncement =
  | { readonly kind: 'ejected'; readonly seats: readonly SeatId[] }
  | { readonly kind: 'matchWon' | 'roundWon'; readonly seat: SeatId }
  | { readonly kind: 'roundDrawn' }

/** What the room reads of the match around the arena: the round, each top's tally, the news of the moment. */
export type SumoStandings = {
  readonly announcement: SumoAnnouncement | null
  readonly roundNumber: number
  readonly tops: readonly {
    readonly isOut: boolean
    readonly seat: SeatId
    readonly wins: number
  }[]
  /** The seat that won the match, while its pause lasts. */
  readonly winner: SeatId | null
}

const announcementOf = ({
  ejection,
  match
}: {
  ejection: ShownEjection | null
  match: Extract<SumoMatch, { stage: 'playing' }>
}): SumoAnnouncement | null => {
  const { round } = match

  if (round.phase === 'decided') {
    if (round.winner === null) {
      return { kind: 'roundDrawn' }
    }

    const isMatchWon = matchWinnerOf(match.wins) === round.winner
    return { kind: isMatchWon ? 'matchWon' : 'roundWon', seat: round.winner }
  }

  return ejection === null ? null : { kind: 'ejected', seats: ejection.seats }
}

/** The standings of a running match, or `null` while the room gathers. */
export const standingsOf = ({
  ejection,
  match
}: {
  ejection: ShownEjection | null
  match: SumoMatch
}): SumoStandings | null => {
  if (match.stage === 'gathering') {
    return null
  }

  return {
    announcement: announcementOf({ ejection, match }),
    roundNumber: match.roundNumber,
    tops: match.round.tops.map((top) => ({
      isOut: top.status !== 'spinning',
      seat: top.seat,
      wins: match.wins.get(top.seat) ?? 0
    })),
    winner: match.round.phase === 'decided' ? matchWinnerOf(match.wins) : null
  }
}
