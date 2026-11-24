import { describe, expect, it } from 'vitest'

import { type BarNote, bistroBarOf } from './bistro-loop'

const STEADY: readonly BarNote['instrument'][] = [
  'bass',
  'piano',
  'ride',
  'brush'
]

const instrumentsOf = (bar: number) =>
  new Set(bistroBarOf(bar).map((note) => note.instrument))

describe('bistro loop', () => {
  it('[sound] the tune plays on the first pass of the turnaround only', () => {
    expect(instrumentsOf(0).has('bell')).toBe(true)
    expect(instrumentsOf(7).has('bell')).toBe(true)
    expect(instrumentsOf(8).has('bell')).toBe(false)
    expect(instrumentsOf(16).has('bell')).toBe(true)
  })

  it('[sound] every bar keeps bass, piano and kit, and stays inside its four beats', () => {
    for (let bar = 0; bar < 16; bar++) {
      const notes = bistroBarOf(bar)
      expect(
        STEADY.every((instrument) => instrumentsOf(bar).has(instrument))
      ).toBe(true)
      expect(notes.every((note) => note.beat >= 0 && note.beat < 4)).toBe(true)
    }
  })

  it('[sound] the last bar walks the bass home on every beat', () => {
    const walk = bistroBarOf(7).filter((note) => note.instrument === 'bass')
    expect(walk.map((note) => note.beat)).toEqual([0, 1, 2, 3])
  })
})
