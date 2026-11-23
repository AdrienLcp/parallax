import type { SeatId } from '@parallax/protocol/identifiers'
import type { Seat, SeatSlot } from '@parallax/protocol/room'

import { seatNameKey } from '@/features/room/seat-name'
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
  slotOf,
  translate
}: {
  announcement: SumoAnnouncement
  slotOf: (seat: SeatId) => SeatSlot | undefined
  translate: Translate
}): SceneAnnouncement => {
  const slotsOf = (seats: readonly SeatId[]): SeatSlot[] =>
    seats.flatMap((seat) => slotOf(seat) ?? [])
  const nameOf = (seat: SeatId): string => {
    const slot = slotOf(seat)
    return slot === undefined ? '' : translate(seatNameKey(slot))
  }

  switch (announcement.kind) {
    case 'ejected':
      return {
        message: translate('sumo.standings.ejected', {
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
  const slotOf = (seat: SeatId) =>
    seats.find((candidate) => candidate.seatId === seat)?.slot

  return {
    announcement:
      standings.announcement === null
        ? null
        : announced({
            announcement: standings.announcement,
            slotOf,
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
