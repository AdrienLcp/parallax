import type { SeatId } from '@parallax/protocol/identifiers'
import type { Seat, SeatSlot } from '@parallax/protocol/room'

import { seatNameOf } from '@/features/room/seat-name'
import type { Translate } from '@/presentation/i18n/translation'

import type {
  SceneAnnouncement,
  SceneStandings,
  SeatStanding
} from '../game-definition'
import type { ClawMatchView } from './claw-match'
import { CLAW_TUNING } from './claw-tuning'

/** How long a catch stays across the display's header. */
export const CATCH_SHOWN_SECONDS = 2.5

/** The claw's standings in the shell's terms, worded in the room's language. */
export const sceneStandingsOf = ({
  seats,
  translate,
  view
}: {
  seats: readonly Seat[]
  translate: Translate
  view: ClawMatchView
}): SceneStandings => {
  const seatOf = (seat: SeatId) =>
    seats.find((candidate) => candidate.seatId === seat)
  const nameOf = (seat: SeatId) => {
    const found = seatOf(seat)
    return found === undefined ? '' : seatNameOf(found, translate)
  }
  const slotsOf = (ids: readonly SeatId[]): SeatSlot[] =>
    ids.flatMap((seat) => seatOf(seat)?.slot ?? [])
  const pointsOf = (points: number) => translate('claw.points', { points })
  const { lastCatch, outcome } = view
  const best = Math.max(0, ...view.claws.map((claw) => claw.score))

  const announcement = ((): SceneAnnouncement | null => {
    if (outcome !== null) {
      const [only, ...others] = outcome.winners
      if (only === undefined) {
        return { message: translate('claw.standings.noWinner'), slots: [] }
      }
      return {
        message:
          others.length === 0
            ? translate('claw.standings.won', {
                points: pointsOf(best),
                seat: nameOf(only)
              })
            : translate('claw.standings.tie', {
                seats: outcome.winners.map(nameOf)
              }),
        slots: slotsOf(outcome.winners)
      }
    }
    if (
      lastCatch !== null &&
      view.elapsed - lastCatch.at < CATCH_SHOWN_SECONDS
    ) {
      return {
        message: translate('claw.standings.caught', {
          prize: translate(`claw.prize.${lastCatch.kind}`),
          seat: nameOf(lastCatch.seat)
        }),
        slots: slotsOf([lastCatch.seat])
      }
    }
    return null
  })()

  const left = Math.max(0, Math.ceil(CLAW_TUNING.roundSeconds - view.elapsed))

  return {
    announcement,
    cue: translate('claw.standings.cue'),
    goal: 0,
    seats: new Map(
      view.claws.map((claw): [SeatId, SeatStanding] => [
        claw.seat,
        {
          isOut: false,
          isWinner: outcome?.winners.includes(claw.seat) ?? false,
          points: pointsOf(claw.score),
          score: claw.score
        }
      ])
    ),
    subtitle:
      left > 0
        ? translate('claw.standings.timeLeft', { seconds: left })
        : translate('claw.standings.timeUp'),
    title: translate('claw.standings.title')
  }
}
