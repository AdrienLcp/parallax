import type { SeatId } from '@parallax/protocol/identifiers'
import type { Seat, SeatSlot } from '@parallax/protocol/room'

import { seatNameOf } from '@/features/room/seat-name'
import type { Locale } from '@/presentation/i18n/locale'
import type { Translate } from '@/presentation/i18n/translation'

import type {
  SceneAnnouncement,
  SceneStandings,
  SeatStanding
} from '../game-definition'
import type { GlobeResult, GlobeView } from './globe-match'
import { GLOBE_TUNING } from './globe-tuning'

/** Under this, a miss reads as close. */
const NEAR_KM = 300

/** How a pin landed, in a few words: inside, near, or how far. */
export const resultWording = (
  { km }: Pick<GlobeResult, 'km'>,
  translate: Translate
): string => {
  const rounded = Math.round(km / 10) * 10
  if (km === 0) return translate('globe.result.inside')
  if (km < NEAR_KM) return translate('globe.result.near', { km: rounded })
  return translate('globe.result.far', { km: rounded })
}

/** Terre's standings in the shell's terms, worded in the room's language: the place asked as the title, its holder ringed by the clock. */
export const sceneStandingsOf = ({
  locale,
  seats,
  translate,
  view
}: {
  locale: Locale
  seats: readonly Seat[]
  translate: Translate
  view: GlobeView
}): SceneStandings => {
  const seatOf = (seat: SeatId) =>
    seats.find((candidate) => candidate.seatId === seat)
  const nameOf = (seat: SeatId) => {
    const found = seatOf(seat)
    return found === undefined ? '' : seatNameOf(found, translate)
  }
  const slotsOf = (ids: readonly SeatId[]): SeatSlot[] =>
    ids.flatMap((seat) => seatOf(seat)?.slot ?? [])
  const pointsOf = (points: number) => translate('globe.points', { points })
  const { outcome, result, turn } = view
  const best = Math.max(0, ...view.scores.values())

  const announcement = ((): SceneAnnouncement | null => {
    if (outcome !== null) {
      const [only, ...others] = outcome.winners
      if (only === undefined) {
        return { message: translate('globe.standings.noWinner'), slots: [] }
      }
      return {
        message:
          others.length === 0
            ? translate('globe.standings.won', {
                points: pointsOf(best),
                seat: nameOf(only)
              })
            : translate('globe.standings.tie', {
                seats: outcome.winners.map(nameOf)
              }),
        slots: slotsOf(outcome.winners)
      }
    }
    if (result !== null) {
      return {
        message: translate('globe.standings.planted', {
          points: pointsOf(result.points),
          result: resultWording(result, translate),
          seat: nameOf(result.seat)
        }),
        slots: slotsOf([result.seat])
      }
    }
    return null
  })()

  const place = turn?.place ?? result?.place ?? null
  const holder = turn?.seat ?? result?.seat ?? null

  return {
    announcement,
    countdown:
      turn === null ? undefined : turn.secondsLeft / GLOBE_TUNING.turnSeconds,
    cue: translate('globe.standings.cue', { turns: GLOBE_TUNING.turnsEach }),
    goal: 0,
    seats: new Map(
      [...view.scores].map(([seat, score]): [SeatId, SeatStanding] => [
        seat,
        {
          isOut: false,
          isWinner: outcome?.winners.includes(seat) ?? false,
          points: pointsOf(score),
          score
        }
      ])
    ),
    subtitle:
      place === null || holder === null
        ? translate('globe.standings.turns', view.turns)
        : translate('globe.standings.turn', {
            kind: translate(`globe.kind.${place.kind}`),
            of: view.turns.of,
            played: Math.min(
              view.turns.played + (turn === null ? 0 : 1),
              view.turns.of
            )
          }),
    title:
      place === null ? translate('globe.standings.title') : place.names[locale],
    titleSlot:
      holder === null || outcome !== null ? undefined : seatOf(holder)?.slot
  }
}
