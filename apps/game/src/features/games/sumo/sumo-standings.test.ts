import { describe, expect, it } from 'vitest'

import type { SumoMatch } from './sumo-match'
import type { SpinningTop } from './sumo-physics'
import { agedEjection, standingsOf, withEjected } from './sumo-standings'
import { SUMO_TUNING } from './sumo-tuning'

const spinning = (seat: string): SpinningTop => ({
  dashCooldown: 0,
  jumpCooldown: 0,
  jumpElapsed: null,
  lastContact: null,
  position: { x: 0, y: 0 },
  seat,
  status: 'spinning',
  velocity: { x: 0, y: 0 }
})

const out = (seat: string) =>
  ({ outBy: null, position: { x: 2, y: 0 }, seat, status: 'out' }) as const

const fighting: SumoMatch = {
  decidedFor: 0,
  round: {
    phase: 'fighting',
    tops: [spinning('red'), spinning('blue'), out('green')]
  },
  roundNumber: 2,
  stage: 'playing',
  wins: new Map([['red', 1]])
}

const decidedBy = (
  winner: string | null,
  wins: ReadonlyMap<string, number>
): SumoMatch => ({
  decidedFor: 0,
  round: {
    phase: 'decided',
    tops: [spinning(winner ?? 'red'), out('blue')],
    winner
  },
  roundNumber: 3,
  stage: 'playing',
  wins
})

describe('sumo standings', () => {
  it('[sumo] the room reads nothing while it gathers', () => {
    expect(standingsOf({ ejection: null, match: { stage: 'gathering' } })).toBe(
      null
    )
  })

  it('[sumo] each top of the round shows its tally and whether it fell', () => {
    expect(standingsOf({ ejection: null, match: fighting })).toEqual({
      announcement: null,
      roundNumber: 2,
      tops: [
        { isOut: false, seat: 'red', wins: 1 },
        { isOut: false, seat: 'blue', wins: 0 },
        { isOut: true, seat: 'green', wins: 0 }
      ],
      winner: null
    })
  })

  it('[sumo] falls close together are announced as one', () => {
    const first = withEjected({ ejected: ['green'], shown: null })
    const later = agedEjection({ seconds: 0.2, shown: first })
    expect(withEjected({ ejected: ['blue'], shown: later })).toEqual({
      age: 0,
      seats: ['green', 'blue']
    })
  })

  it('[sumo] a later fall replaces the one on show', () => {
    const first = withEjected({ ejected: ['green'], shown: null })
    const later = agedEjection({ seconds: 1, shown: first })
    expect(withEjected({ ejected: ['blue'], shown: later })?.seats).toEqual([
      'blue'
    ])
  })

  it('[sumo] a fall stops being announced once it has been read', () => {
    const shown = withEjected({ ejected: ['green'], shown: null })
    expect(agedEjection({ seconds: 3, shown })).toBe(null)
  })

  it('[sumo] the fall on show is the announcement while the round goes on', () => {
    const ejection = withEjected({ ejected: ['green'], shown: null })
    expect(standingsOf({ ejection, match: fighting })?.announcement).toEqual({
      kind: 'ejected',
      seats: ['green']
    })
  })

  it('[sumo] a decided round announces its winner over the last fall', () => {
    const ejection = withEjected({ ejected: ['blue'], shown: null })
    const standings = standingsOf({
      ejection,
      match: decidedBy('red', new Map([['red', 1]]))
    })
    expect(standings?.announcement).toEqual({ kind: 'roundWon', seat: 'red' })
    expect(standings?.winner).toBe(null)
  })

  it('[sumo] the round that reaches the tally announces the match winner', () => {
    const standings = standingsOf({
      ejection: null,
      match: decidedBy('red', new Map([['red', SUMO_TUNING.roundsToWin]]))
    })
    expect(standings?.announcement).toEqual({ kind: 'matchWon', seat: 'red' })
    expect(standings?.winner).toBe('red')
  })

  it('[sumo] a round where the last tops fall together is drawn', () => {
    expect(
      standingsOf({ ejection: null, match: decidedBy(null, new Map()) })
        ?.announcement
    ).toEqual({ kind: 'roundDrawn' })
  })
})
