import type { SeatId } from '@parallax/protocol/identifiers'
import type { SeatSlot } from '@parallax/protocol/room'

import { type ArenaFrame, drawnTopsOf } from './arena-frame'
import { botInputsOf } from './showcase-bots'
import { advanceRound, type SumoRound, startRound } from './sumo-round'

/** The demo tops, by seat: four lacquers spread around the arena. */
export const SHOWCASE_SLOTS: readonly SeatSlot[] = [0, 3, 4, 1]

/** How long the demo tops stand on their marks before a round starts. */
export const SHOWCASE_MARK_SECONDS = 0.8

/** How long a decided round stays on the arena before the next one: a beat to see who is left. */
export const SHOWCASE_DECIDED_SECONDS = 1.6

/** A round that drags on past this is started over: the showcase never stalls. */
export const SHOWCASE_LONGEST_ROUND_SECONDS = 30

const showcaseSeatOf = (slot: SeatSlot): SeatId => `showcase-${slot}`

const SLOT_BY_SEAT: ReadonlyMap<SeatId, SeatSlot> = new Map(
  SHOWCASE_SLOTS.map((slot) => [showcaseSeatOf(slot), slot])
)

/** The sumo playing by itself, for the game choice: bots on the arena, rounds following one another. */
export type ShowcasePlay = {
  /** Seconds since the showcase started: the bots' wander loops run on it. */
  readonly clock: number
  readonly round: SumoRound
  /** Seconds since the round left its marks, or since it was decided. */
  readonly roundFor: number
}

const freshRound = (): SumoRound => ({
  phase: 'countdown',
  remaining: SHOWCASE_MARK_SECONDS,
  tops: startRound(SHOWCASE_SLOTS.map(showcaseSeatOf)).tops
})

/** The demo tops on their marks, about to start. */
export const startShowcase = (clock = 0): ShowcasePlay => ({
  clock,
  round: freshRound(),
  roundFor: 0
})

const isRoundOver = ({ round, roundFor }: ShowcasePlay): boolean =>
  round.phase === 'decided'
    ? roundFor >= SHOWCASE_DECIDED_SECONDS
    : roundFor >= SHOWCASE_LONGEST_ROUND_SECONDS

/** Advances the showcase by `seconds`: the bots drive, and a round over gives way to a fresh one. */
export const advanceShowcase = (
  play: ShowcasePlay,
  { random, seconds }: { random: () => number; seconds: number }
): ShowcasePlay => {
  const clock = play.clock + seconds
  if (isRoundOver(play)) return startShowcase(clock)

  const { controls, dashes } = botInputsOf({
    clock,
    phaseOf: (seat) => SLOT_BY_SEAT.get(seat) ?? 0,
    random,
    seconds,
    tops: play.round.tops
  })
  const round = advanceRound(play.round, { controls, dashes, seconds })
  const hasPhaseChanged = round.phase !== play.round.phase
  return {
    clock,
    round,
    roundFor: hasPhaseChanged ? 0 : play.roundFor + seconds
  }
}

/** What the arena draws of the showcase: its tops, never absent, in their demo lacquers. */
export const showcaseFrameOf = ({ round }: ShowcasePlay): ArenaFrame => ({
  tops: round.tops.flatMap((top) =>
    drawnTopsOf({
      isAbsent: false,
      slot: SLOT_BY_SEAT.get(top.seat) ?? 0,
      top
    })
  )
})
