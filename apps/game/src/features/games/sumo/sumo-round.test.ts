import { describe, expect, it } from 'vitest'

import { lengthOf } from '@/helpers/planar-vector'

import { advanceRound, matchWinnerOf, startRound, tallied } from './sumo-round'
import { SUMO_STEP_SECONDS, SUMO_TUNING } from './sumo-tuning'

const idle = {
  controls: new Map(),
  dashes: new Set<string>(),
  seconds: SUMO_STEP_SECONDS
}

describe('sumo round', () => {
  it('[sumo] every seat starts on its own mark around the centre', () => {
    const round = startRound(['red', 'blue', 'green'])
    const marks = round.tops.map((top) => top.position)
    expect(
      marks.every(
        (mark) => Math.abs(lengthOf(mark) - SUMO_TUNING.spawnRadius) < 1e-9
      )
    ).toBe(true)
    expect(
      new Set(marks.map((mark) => `${mark.x.toFixed(3)},${mark.y.toFixed(3)}`))
        .size
    ).toBe(3)
  })

  it('[sumo] the fight starts once the countdown runs out', () => {
    const counting = advanceRound(startRound(['red', 'blue']), {
      ...idle,
      seconds: 1
    })
    expect(counting.phase).toBe('countdown')
    const fighting = advanceRound(counting, {
      ...idle,
      seconds: SUMO_TUNING.countdownSeconds
    })
    expect(fighting.phase).toBe('fighting')
  })

  it('[sumo] the last top spinning wins the round', () => {
    const round = advanceRound(
      {
        phase: 'fighting',
        tops: [
          {
            dashCooldown: 0,
            position: { x: 0, y: 0 },
            seat: 'red',
            status: 'spinning',
            velocity: { x: 0, y: 0 }
          },
          { position: { x: 2, y: 0 }, seat: 'blue', status: 'out' }
        ]
      },
      idle
    )
    expect(round).toMatchObject({ phase: 'decided', winner: 'red' })
  })

  it('[sumo] the round waits for a falling top before it is decided', () => {
    const round = advanceRound(
      {
        phase: 'fighting',
        tops: [
          {
            dashCooldown: 0,
            position: { x: 0, y: 0 },
            seat: 'red',
            status: 'spinning',
            velocity: { x: 0, y: 0 }
          },
          {
            fallElapsed: 0,
            position: { x: 1.2, y: 0 },
            seat: 'blue',
            status: 'falling',
            velocity: { x: 0.1, y: 0 }
          }
        ]
      },
      idle
    )
    expect(round.phase).toBe('fighting')
  })

  it('[sumo] the match goes to the first seat with enough round wins', () => {
    const decided = { phase: 'decided', tops: [], winner: 'red' } as const
    const wins = Array.from({ length: SUMO_TUNING.roundsToWin }).reduce<
      ReadonlyMap<string, number>
    >((current) => tallied({ round: decided, wins: current }), new Map())
    expect(matchWinnerOf(wins)).toBe('red')
    expect(
      matchWinnerOf(new Map([['red', SUMO_TUNING.roundsToWin - 1]]))
    ).toBeNull()
  })
})
