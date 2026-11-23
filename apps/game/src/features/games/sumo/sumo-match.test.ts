import { describe, expect, it } from 'vitest'

import {
  advanceMatch,
  ejectedBetween,
  GATHERING,
  type SumoMatch
} from './sumo-match'
import type { SpinningTop } from './sumo-physics'
import { reportedState } from './sumo-state-report'
import { SUMO_STEP_SECONDS, SUMO_TUNING } from './sumo-tuning'

const step = (present: readonly string[], seconds = SUMO_STEP_SECONDS) => ({
  controls: new Map(),
  dashes: new Set<string>(),
  present,
  seconds
})

const spinningAt = (seat: string, x: number, speed = 0): SpinningTop => ({
  dashCooldown: 0,
  position: { x, y: 0 },
  seat,
  status: 'spinning',
  velocity: { x: speed, y: 0 }
})

const decidedFor = ({
  wins,
  winner
}: {
  wins: ReadonlyMap<string, number>
  winner: string
}): SumoMatch => ({
  decidedFor: 0,
  round: {
    phase: 'decided',
    tops: [
      spinningAt(winner, 0),
      { position: { x: 2, y: 0 }, seat: 'other', status: 'out' }
    ],
    winner
  },
  roundNumber: 1,
  stage: 'playing',
  wins
})

describe('sumo match', () => {
  it('[sumo] the room gathers until two phones are present', () => {
    expect(advanceMatch(GATHERING, step(['red']))).toBe(GATHERING)
    const started = advanceMatch(GATHERING, step(['red', 'blue']))
    expect(started).toMatchObject({
      round: { phase: 'countdown' },
      stage: 'playing'
    })
  })

  it('[sumo] a round takes the six first present seats at most', () => {
    const started = advanceMatch(
      GATHERING,
      step(['a', 'b', 'c', 'd', 'e', 'f', 'g'])
    )
    expect(
      started.stage === 'playing' && started.round.tops.map((top) => top.seat)
    ).toEqual(['a', 'b', 'c', 'd', 'e', 'f'])
  })

  it('[sumo] the winner of a round scores once', () => {
    const fighting: SumoMatch = {
      decidedFor: 0,
      round: {
        phase: 'fighting',
        tops: [
          spinningAt('red', 0),
          { position: { x: 2, y: 0 }, seat: 'blue', status: 'out' }
        ]
      },
      roundNumber: 1,
      stage: 'playing',
      wins: new Map()
    }
    const decided = advanceMatch(fighting, step(['red', 'blue']))
    const paused = advanceMatch(decided, step(['red', 'blue']))
    expect(paused.stage === 'playing' && paused.wins.get('red')).toBe(1)
  })

  it('[sumo] the next round starts after the pause, keeping the tally', () => {
    const decided = decidedFor({ winner: 'red', wins: new Map([['red', 1]]) })
    const waiting = advanceMatch(decided, step(['red', 'blue'], 1))
    expect(waiting.stage === 'playing' && waiting.round.phase).toBe('decided')
    const next = advanceMatch(
      decided,
      step(['red', 'blue'], SUMO_TUNING.roundPauseSeconds)
    )
    expect(next).toMatchObject({
      round: { phase: 'countdown' },
      roundNumber: 2
    })
    expect(next.stage === 'playing' && next.wins.get('red')).toBe(1)
  })

  it('[sumo] a won match starts over from no wins after its longer pause', () => {
    const decided = decidedFor({
      winner: 'red',
      wins: new Map([['red', SUMO_TUNING.roundsToWin]])
    })
    const held = advanceMatch(
      decided,
      step(['red', 'blue'], SUMO_TUNING.roundPauseSeconds)
    )
    expect(held.stage === 'playing' && held.round.phase).toBe('decided')
    const fresh = advanceMatch(
      decided,
      step(['red', 'blue'], SUMO_TUNING.matchPauseSeconds)
    )
    expect(fresh).toMatchObject({ roundNumber: 1, wins: new Map() })
  })

  it('[sumo] the room gathers again when too few phones stay for the next round', () => {
    const decided = decidedFor({ winner: 'red', wins: new Map([['red', 1]]) })
    expect(
      advanceMatch(decided, step(['red'], SUMO_TUNING.roundPauseSeconds))
    ).toBe(GATHERING)
  })

  it('[sumo] a top that leaves the platform is ejected once', () => {
    const fighting: SumoMatch = {
      decidedFor: 0,
      round: {
        phase: 'fighting',
        tops: [
          spinningAt('red', 0),
          spinningAt('blue', SUMO_TUNING.arenaRadius - 0.001, 1)
        ]
      },
      roundNumber: 1,
      stage: 'playing',
      wins: new Map()
    }
    const pushed = advanceMatch(fighting, step(['red', 'blue']))
    expect(ejectedBetween({ next: pushed, previous: fighting })).toEqual([
      'blue'
    ])
    const later = advanceMatch(pushed, step(['red', 'blue']))
    expect(ejectedBetween({ next: later, previous: pushed })).toEqual([])
  })
})

describe('sumo state report', () => {
  it('[sumo] a gathering room reports the lobby', () => {
    expect(reportedState(GATHERING)).toEqual({
      phase: 'lobby',
      tops: [],
      type: 'sumo.state'
    })
  })

  it('[sumo] a falling top is already reported out, with each tally', () => {
    const match: SumoMatch = {
      decidedFor: 0,
      round: {
        phase: 'fighting',
        tops: [
          spinningAt('red', 0),
          {
            fallElapsed: 0,
            position: { x: 1.1, y: 0 },
            seat: 'blue',
            status: 'falling',
            velocity: { x: 1, y: 0 }
          }
        ]
      },
      roundNumber: 1,
      stage: 'playing',
      wins: new Map([['blue', 2]])
    }
    expect(reportedState(match).tops).toEqual([
      { roundsWon: 0, seatId: 'red', status: 'spinning' },
      { roundsWon: 2, seatId: 'blue', status: 'out' }
    ])
  })
})
