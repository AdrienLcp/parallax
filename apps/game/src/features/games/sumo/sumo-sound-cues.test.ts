import { describe, expect, it } from 'vitest'

import type { SumoMatch } from './sumo-match'
import type { SpinningTop } from './sumo-physics'
import { advanceRound, type SumoRound, startRound } from './sumo-round'
import { soundCuesBetween } from './sumo-sound-cues'
import { SUMO_STEP_SECONDS, SUMO_TUNING } from './sumo-tuning'

const idle = {
  controls: new Map(),
  dashes: new Set<string>(),
  seconds: SUMO_STEP_SECONDS
}

const playing = (
  round: SumoRound,
  wins: ReadonlyMap<string, number> = new Map()
): SumoMatch => ({
  decidedFor: 0,
  round,
  roundNumber: 1,
  stage: 'playing',
  wins
})

const fighting = (tops: SpinningTop[]): SumoRound => ({
  phase: 'fighting',
  tops
})

const top = (
  seat: string,
  x: number,
  velocityX: number,
  overrides: Partial<SpinningTop> = {}
): SpinningTop => ({
  dashCooldown: 0,
  jumpCooldown: 0,
  jumpElapsed: null,
  lastContact: null,
  position: { x, y: 0 },
  seat,
  status: 'spinning',
  velocity: { x: velocityX, y: 0 },
  ...overrides
})

const kindsOf = (previous: SumoMatch, next: SumoMatch) =>
  soundCuesBetween({ next, previous }).map((cue) => cue.kind)

const clackBetween = (closingSpeed: number) => {
  const before = fighting([
    top('red', -SUMO_TUNING.topRadius - 0.001, closingSpeed / 2),
    top('blue', SUMO_TUNING.topRadius + 0.001, -closingSpeed / 2)
  ])
  const after = advanceRound(before, idle)
  return soundCuesBetween({ next: playing(after), previous: playing(before) })
}

describe('sumo sound cues', () => {
  it('[sumo] the countdown beats each second, then the fight rings in', () => {
    const start = startRound(['red', 'blue'])
    const oneLeft = advanceRound(start, {
      ...idle,
      seconds: SUMO_TUNING.countdownSeconds - 0.5
    })
    const fight = advanceRound(oneLeft, { ...idle, seconds: 1 })

    expect(
      soundCuesBetween({
        next: playing(start),
        previous: { stage: 'gathering' }
      })
    ).toEqual([{ kind: 'countdown', remaining: 3 }])
    expect(
      soundCuesBetween({ next: playing(oneLeft), previous: playing(start) })
    ).toEqual([{ kind: 'countdown', remaining: 1 }])
    expect(kindsOf(playing(oneLeft), playing(fight))).toEqual(['fight'])
  })

  it('[sumo] two tops meeting clack once, louder the harder they meet', () => {
    const soft = clackBetween(0.4)
    const hard = clackBetween(2)

    expect(soft).toHaveLength(1)
    expect(hard).toHaveLength(1)
    const [softClack] = soft
    const [hardClack] = hard
    if (softClack?.kind !== 'clack' || hardClack?.kind !== 'clack') {
      throw new Error('expected clacks')
    }
    expect(hardClack.strength).toBeGreaterThan(softClack.strength)
  })

  it('[sumo] tops still pressed together after their clack stay quiet', () => {
    const pressed = fighting([
      top('red', -0.05, 0, { lastContact: { seat: 'blue', since: 0 } }),
      top('blue', 0.05, 0, { lastContact: { seat: 'red', since: 0 } })
    ])

    expect(kindsOf(playing(pressed), playing(pressed))).toEqual([])
  })

  it('[sumo] a dash whooshes and a top over the rim falls', () => {
    const before = fighting([
      top('red', 0, 0),
      top('blue', SUMO_TUNING.arenaRadius - 0.001, 1)
    ])
    const after = advanceRound(before, { ...idle, dashes: new Set(['red']) })

    expect(kindsOf(playing(before), playing(after)).sort()).toEqual([
      'dash',
      'fall'
    ])
  })

  it('[sumo] a jump hops, and a falling top bursts as it hits the floor', () => {
    const before = fighting([top('red', 0, 0), top('blue', 0.5, 0)])
    const after = advanceRound(before, { ...idle, jumps: new Set(['red']) })
    expect(kindsOf(playing(before), playing(after))).toEqual(['jump'])

    const falling = advanceRound(
      fighting([
        top('red', 0, 0),
        top('blue', SUMO_TUNING.arenaRadius - 0.001, 1)
      ]),
      idle
    )
    const fallSteps = Math.ceil(SUMO_TUNING.fallSeconds / idle.seconds) + 1
    let landed = falling
    for (let step = 0; step < fallSteps; step++) {
      landed = advanceRound(landed, idle)
    }
    expect(kindsOf(playing(falling), playing(landed))).toContain('burst')
  })

  it('[sumo] a decided round tells a win, a draw and the match apart', () => {
    const before = playing(fighting([top('red', 0, 0), top('blue', 0.5, 0)]))
    const won: SumoRound = { phase: 'decided', tops: [], winner: 'red' }
    const drawn: SumoRound = { phase: 'decided', tops: [], winner: null }

    expect(kindsOf(before, playing(won))).toEqual(['roundWon'])
    expect(kindsOf(before, playing(drawn))).toEqual(['draw'])
    expect(
      kindsOf(before, playing(won, new Map([['red', SUMO_TUNING.roundsToWin]])))
    ).toEqual(['matchWon'])
    expect(kindsOf(playing(won), playing(won))).toEqual([])
  })
})
