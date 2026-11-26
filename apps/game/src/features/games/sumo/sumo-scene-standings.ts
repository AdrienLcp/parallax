import type { SeatId } from '@parallax/protocol/identifiers'
import type { Seat, SeatSlot } from '@parallax/protocol/room'

import { seatNameOf } from '@/features/room/seat-name'
import type { Translate } from '@/presentation/i18n/translation'

import type {
  SceneAnnouncement,
  SceneStandings,
  SeatStanding
} from '../game-definition'
import type { SumoAnnouncement, SumoStandings } from './sumo-standings'
import { SUMO_TUNING } from './sumo-tuning'

const announced = ({
  announcement,
  seatOf,
  translate
}: {
  announcement: SumoAnnouncement
  seatOf: (seat: SeatId) => Seat | undefined
  translate: Translate
}): SceneAnnouncement => {
  const slotsOf = (seats: readonly SeatId[]): SeatSlot[] =>
    seats.flatMap((seat) => seatOf(seat)?.slot ?? [])
  const nameOf = (seatId: SeatId): string => {
    const seat = seatOf(seatId)
    return seat === undefined ? '' : seatNameOf(seat, translate)
  }

  switch (announcement.kind) {
    case 'ejected':
      return {
        message: translate('sumo.standings.ejected', {
          count: announcement.seats.length,
          seats: announcement.seats.map(nameOf)
        }),
        slots: slotsOf(announcement.seats)
      }
    case 'roundWon':
    case 'matchWon':
      return {
        message: translate(
          announcement.kind === 'matchWon'
            ? 'sumo.standings.matchWon'
            : 'sumo.standings.roundWon',
          { seat: nameOf(announcement.seat) }
        ),
        slots: slotsOf([announcement.seat])
      }
    case 'roundDrawn':
      return { message: translate('sumo.standings.roundDrawn'), slots: [] }
    default:
      return announcement satisfies never
  }
}

/** The sumo's standings in the shell's terms, worded in the room's language. */
export const sceneStandingsOf = ({
  seats,
  standings,
  translate
}: {
  seats: readonly Seat[]
  standings: SumoStandings
  translate: Translate
}): SceneStandings => {
  const seatOf = (seat: SeatId) =>
    seats.find((candidate) => candidate.seatId === seat)

  return {
    announcement:
      standings.announcement === null
        ? null
        : announced({
            announcement: standings.announcement,
            seatOf,
            translate
          }),
    cue: translate('sumo.standings.firstTo', {
      rounds: SUMO_TUNING.roundsToWin
    }),
    goal: SUMO_TUNING.roundsToWin,
    seats: new Map(
      standings.tops.map((top): [SeatId, SeatStanding] => [
        top.seat,
        {
          isOut: top.isOut,
          isWinner: top.seat === standings.winner,
          score: top.wins
        }
      ])
    ),
    subtitle: translate('sumo.standings.inPlay', {
      count: standings.tops.filter((top) => !top.isOut).length
    }),
    title: translate('sumo.standings.round', { number: standings.roundNumber })
  }
}
