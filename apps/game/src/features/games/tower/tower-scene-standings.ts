import type { SeatId } from '@parallax/protocol/identifiers'
import type { Seat, SeatSlot } from '@parallax/protocol/room'

import { seatNameOf } from '@/features/room/seat-name'
import type { Translate } from '@/presentation/i18n/translation'

import type {
  SceneAnnouncement,
  SceneStandings,
  SeatStanding
} from '../game-definition'
import { heightCm, type TowerMatchView } from './tower-match'
import { TOWER_TUNING } from './tower-tuning'

/** A height as the chart reads it: "84 cm", then "1 m 04". */
export const formatHeight = (height: number, translate: Translate): string => {
  const cm = heightCm(height)
  return cm < 100
    ? translate('tower.height.centimetres', { cm })
    : translate('tower.height.metres', {
        cm: String(cm % 100).padStart(2, '0'),
        metres: Math.floor(cm / 100)
      })
}

/** The tower's standings in the shell's terms, worded in the room's language. */
export const sceneStandingsOf = ({
  seats,
  translate,
  view
}: {
  seats: readonly Seat[]
  translate: Translate
  view: TowerMatchView
}): SceneStandings => {
  const seatOf = (seat: SeatId) =>
    seats.find((candidate) => candidate.seatId === seat)
  const nameOf = (seat: SeatId | null | undefined) => {
    const found = seat == null ? undefined : seatOf(seat)
    return found === undefined ? '' : seatNameOf(found, translate)
  }
  const slotsOf = (ids: readonly SeatId[]): SeatSlot[] =>
    ids.flatMap((seat) => seatOf(seat)?.slot ?? [])
  const { outcome } = view
  const tallest = Math.max(0, ...view.lanes.map((lane) => lane.height))

  const announcement = ((): SceneAnnouncement | null => {
    switch (outcome?.kind) {
      case undefined:
        return null
      case 'toppled':
        return {
          message: translate('tower.standings.toppled', {
            seat: nameOf(outcome.seat)
          }),
          slots: slotsOf([outcome.seat])
        }
      case 'ceiling':
        return {
          message: translate('tower.standings.ceiling'),
          slots: slotsOf(outcome.seats)
        }
      case 'tallest':
        return outcome.seat === null
          ? { message: translate('tower.standings.tie'), slots: [] }
          : {
              message: translate('tower.standings.won', {
                height: formatHeight(tallest, translate),
                seat: nameOf(outcome.seat)
              }),
              slots: slotsOf([outcome.seat])
            }
      default:
        return outcome satisfies never
    }
  })()

  const isWinner = (seat: SeatId) =>
    (outcome?.kind === 'tallest' && outcome.seat === seat) ||
    (outcome?.kind === 'ceiling' && outcome.seats.includes(seat))

  const shared = view.rule === 'shared' ? view.lanes[0] : undefined
  const left = Math.max(0, Math.ceil(TOWER_TUNING.raceSeconds - view.elapsed))

  return {
    announcement,
    cue: translate(
      shared === undefined
        ? 'tower.standings.raceCue'
        : 'tower.standings.sharedCue'
    ),
    goal: 0,
    seats: new Map(
      view.lanes.flatMap((lane) =>
        lane.seats.map((seat): [SeatId, SeatStanding] => [
          seat,
          {
            isOut: outcome?.kind === 'toppled' && outcome.seat === seat,
            isWinner: isWinner(seat),
            score: 0
          }
        ])
      )
    ),
    subtitle:
      shared === undefined
        ? translate('tower.standings.timeLeft', { seconds: left })
        : shared.floating === null
          ? formatHeight(shared.height, translate)
          : translate('tower.standings.turnOf', {
              seat: nameOf(shared.floating.seat)
            }),
    title: translate(
      shared === undefined ? 'tower.standings.race' : 'tower.standings.shared'
    )
  }
}
