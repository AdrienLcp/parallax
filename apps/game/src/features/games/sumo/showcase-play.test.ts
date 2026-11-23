import { describe, expect, it } from 'vitest'

import {
  advanceShowcase,
  SHOWCASE_DECIDED_SECONDS,
  SHOWCASE_LONGEST_ROUND_SECONDS,
  SHOWCASE_SLOTS,
  type ShowcasePlay,
  showcaseFrameOf,
  startShowcase
} from './showcase-play'
import { SUMO_STEP_SECONDS, SUMO_TUNING } from './sumo-tuning'

const step = { random: () => 0.999, seconds: SUMO_STEP_SECONDS }

const decided = (roundFor: number): ShowcasePlay => {
  const { round } = startShowcase()
  return {
    clock: 10,
    round: { phase: 'decided', tops: round.tops, winner: null },
    roundFor
  }
}

describe('showcase play', () => {
  it('[showcase] the demo tops stand on their marks, one per demo lacquer', () => {
    const { tops } = showcaseFrameOf(startShowcase())
    expect(tops.map((top) => top.slot)).toEqual(SHOWCASE_SLOTS)
    expect(
      tops.every(
        (top) =>
          Math.abs(
            Math.hypot(top.position.x, top.position.y) - SUMO_TUNING.spawnRadius
          ) < 1e-9
      )
    ).toBe(true)
  })

  it('[showcase] the fight starts after a short stand on the marks', () => {
    let play = startShowcase()
    for (let elapsed = 0; elapsed < 1; elapsed += SUMO_STEP_SECONDS) {
      play = advanceShowcase(play, step)
    }
    expect(play.round.phase).toBe('fighting')
  })

  it('[showcase] a decided round stays a beat, then gives way to a fresh one', () => {
    expect(
      advanceShowcase(decided(SHOWCASE_DECIDED_SECONDS / 2), step).round.phase
    ).toBe('decided')
    const next = advanceShowcase(decided(SHOWCASE_DECIDED_SECONDS), step)
    expect(next.round.phase).toBe('countdown')
    expect(next.round.tops).toHaveLength(SHOWCASE_SLOTS.length)
    expect(next.clock).toBeGreaterThan(10)
  })

  it('[showcase] a round that drags on is started over', () => {
    const { round } = startShowcase()
    const dragging: ShowcasePlay = {
      clock: 40,
      round: { phase: 'fighting', tops: round.tops },
      roundFor: SHOWCASE_LONGEST_ROUND_SECONDS
    }
    expect(advanceShowcase(dragging, step).round.phase).toBe('countdown')
  })

  it('[showcase] the bots play rounds to a decision on their own', () => {
    let play = startShowcase()
    let isDecided = false
    for (
      let elapsed = 0;
      elapsed < 120 && !isDecided;
      elapsed += SUMO_STEP_SECONDS
    ) {
      play = advanceShowcase(play, step)
      isDecided = play.round.phase === 'decided'
    }
    expect(isDecided).toBe(true)
  })
})
