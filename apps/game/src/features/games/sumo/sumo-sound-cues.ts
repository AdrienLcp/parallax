import { lengthOf, subtracted } from '@/helpers/planar-vector'

import { countdownShown, type SumoMatch } from './sumo-match'
import type { SpinningTop, Top } from './sumo-physics'
import { matchWinnerOf } from './sumo-round'

/** What the room hears of the sumo between two frames. */
export type SumoSoundCue =
  | { readonly kind: 'clack'; readonly strength: number }
  | { readonly kind: 'countdown'; readonly remaining: number }
  | {
      readonly kind:
        | 'burst'
        | 'dash'
        | 'draw'
        | 'fall'
        | 'fight'
        | 'jump'
        | 'matchWon'
        | 'roundWon'
    }

/** The closing speed, in arena radii per second, that clacks at full strength. */
const LOUDEST_CLOSING_SPEED = 2.4
const SOFTEST_CLACK = 0.15
/** A pile-up of more contacts in one frame would only add noise. */
const MOST_CLACKS_PER_FRAME = 3

const topsOf = (match: SumoMatch): readonly Top[] =>
  match.stage === 'playing' ? match.round.tops : []

const spinningBySeat = (match: SumoMatch): Map<Top['seat'], SpinningTop> =>
  new Map(
    topsOf(match)
      .filter((top): top is SpinningTop => top.status === 'spinning')
      .map((top) => [top.seat, top])
  )

/** A contact newer than the one the top had last frame: its clock went back, or it touched someone else. */
const isFreshContact = (
  next: SpinningTop,
  previous: SpinningTop | undefined
): boolean => {
  if (next.lastContact === null) return false
  const before = previous?.lastContact ?? null
  return (
    before === null ||
    before.seat !== next.lastContact.seat ||
    next.lastContact.since < before.since
  )
}

const clacksBetween = (
  previous: Map<Top['seat'], SpinningTop>,
  next: Map<Top['seat'], SpinningTop>
): SumoSoundCue[] => {
  const heard = new Set<string>()
  const clacks: SumoSoundCue[] = []
  for (const top of next.values()) {
    const before = previous.get(top.seat)
    if (top.lastContact === null || !isFreshContact(top, before)) continue
    const pair = [top.seat, top.lastContact.seat].sort().join('|')
    if (heard.has(pair)) continue
    heard.add(pair)
    const other = previous.get(top.lastContact.seat)
    const closingSpeed =
      before === undefined || other === undefined
        ? 0
        : lengthOf(subtracted(before.velocity, other.velocity))
    clacks.push({
      kind: 'clack',
      strength: Math.min(
        1,
        Math.max(SOFTEST_CLACK, closingSpeed / LOUDEST_CLOSING_SPEED)
      )
    })
  }
  return clacks.slice(0, MOST_CLACKS_PER_FRAME)
}

const dashesBetween = (
  previous: Map<Top['seat'], SpinningTop>,
  next: Map<Top['seat'], SpinningTop>
): SumoSoundCue[] =>
  [...next.values()]
    .filter((top) => {
      const before = previous.get(top.seat)
      return before !== undefined && top.dashCooldown > before.dashCooldown
    })
    .map(() => ({ kind: 'dash' }))

const jumpsBetween = (
  previous: Map<Top['seat'], SpinningTop>,
  next: Map<Top['seat'], SpinningTop>
): SumoSoundCue[] =>
  [...next.values()]
    .filter((top) => {
      const before = previous.get(top.seat)
      return (
        before !== undefined &&
        before.jumpElapsed === null &&
        top.jumpElapsed !== null
      )
    })
    .map(() => ({ kind: 'jump' }))

/** A falling top that hits the floor this frame. */
const burstsBetween = (
  previous: SumoMatch,
  next: SumoMatch
): SumoSoundCue[] => {
  const fallingBefore = new Set(
    topsOf(previous)
      .filter((top) => top.status === 'falling')
      .map((top) => top.seat)
  )
  return topsOf(next)
    .filter((top) => top.status === 'out' && fallingBefore.has(top.seat))
    .map(() => ({ kind: 'burst' }))
}

const fallsBetween = (
  previous: Map<Top['seat'], SpinningTop>,
  next: SumoMatch
): SumoSoundCue[] =>
  topsOf(next)
    .filter((top) => top.status !== 'spinning' && previous.has(top.seat))
    .map(() => ({ kind: 'fall' }))

const countdownBetween = (
  previous: SumoMatch,
  next: SumoMatch
): SumoSoundCue[] => {
  const before = countdownShown(previous)
  const now = countdownShown(next)
  if (now !== null && now !== before) {
    return [{ kind: 'countdown', remaining: now }]
  }
  const hasFightBegun =
    before !== null &&
    next.stage === 'playing' &&
    next.round.phase === 'fighting'
  return hasFightBegun ? [{ kind: 'fight' }] : []
}

const outcomeBetween = (
  previous: SumoMatch,
  next: SumoMatch
): SumoSoundCue[] => {
  if (
    previous.stage !== 'playing' ||
    previous.round.phase === 'decided' ||
    next.stage !== 'playing' ||
    next.round.phase !== 'decided'
  ) {
    return []
  }
  if (matchWinnerOf(next.wins) !== null) return [{ kind: 'matchWon' }]
  return [{ kind: next.round.winner === null ? 'draw' : 'roundWon' }]
}

/**
 * The cues to play for what changed between two frames of the match: the
 * countdown's beats, tops clacking, dashing, jumping, falling and bursting
 * on the floor, and how the round
 * ended. Read from the tops themselves, so the rules never know about sound.
 */
export const soundCuesBetween = ({
  next,
  previous
}: {
  next: SumoMatch
  previous: SumoMatch
}): SumoSoundCue[] => {
  const spinningBefore = spinningBySeat(previous)
  const spinningNow = spinningBySeat(next)
  return [
    ...countdownBetween(previous, next),
    ...clacksBetween(spinningBefore, spinningNow),
    ...dashesBetween(spinningBefore, spinningNow),
    ...jumpsBetween(spinningBefore, spinningNow),
    ...fallsBetween(spinningBefore, next),
    ...burstsBetween(previous, next),
    ...outcomeBetween(previous, next)
  ]
}
