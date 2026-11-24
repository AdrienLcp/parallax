import { describe, expect, it } from 'vitest'

import { localMomentAt } from '@/infrastructure/dates'

import {
  backdropColorOf,
  hexOf,
  LENS_RANGES,
  parseTuning,
  relativeLuminanceOf,
  SHIPPED_TUNING,
  toneOfBackdrop
} from './display-tuning'
import { tuningFileNameOf, tuningFileOf } from './tuning-file'

describe('parseTuning', () => {
  it.each([
    ['nothing', undefined],
    ['null', null],
    ['a number', 42],
    ['a string', 'tuned'],
    ['an array', [1, 2]],
    ['an empty object', {}]
  ])('falls back to the shipped tuning from %s', (_, stored) => {
    expect(parseTuning(stored)).toEqual(SHIPPED_TUNING)
  })

  it('reads back what it was given', () => {
    const tuned = {
      ...SHIPPED_TUNING,
      arena: {
        ...SHIPPED_TUNING.arena,
        lens: { ...SHIPPED_TUNING.arena.lens, pitchDegrees: 32 },
        motion: { orbit: 'waiting', orbitDegreesPerSecond: 20, swayDegrees: 8 }
      },
      backdrop: '#f0e6d2',
      hud: { scale: 0.8, showHeader: false, showQr: true, showRoster: false }
    }
    expect(parseTuning(JSON.parse(JSON.stringify(tuned)))).toEqual(tuned)
  })

  it('brings a number out of range back inside it', () => {
    const parsed = parseTuning({
      arena: { lens: { fieldOfViewDegrees: 400, pitchDegrees: -10 } }
    })
    expect(parsed.arena.lens.fieldOfViewDegrees).toBe(
      LENS_RANGES.fieldOfViewDegrees.highest
    )
    expect(parsed.arena.lens.pitchDegrees).toBe(LENS_RANGES.pitchDegrees.lowest)
  })

  it('keeps the shipped value of each field it cannot read, and the fields it can', () => {
    const parsed = parseTuning({
      arena: {
        lens: { frameFill: 'wide', pitchDegrees: 30 },
        motion: { orbit: 'sometimes' },
        shape: 'tall'
      },
      backdrop: 'pink',
      hud: { scale: Number.NaN, showQr: 'no' }
    })
    expect(parsed.arena.lens).toEqual({
      ...SHIPPED_TUNING.arena.lens,
      pitchDegrees: 30
    })
    expect(parsed.arena.motion).toEqual(SHIPPED_TUNING.arena.motion)
    expect(parsed.arena.shape).toEqual(SHIPPED_TUNING.arena.shape)
    expect(parsed.backdrop).toBe(SHIPPED_TUNING.backdrop)
    expect(parsed.hud).toEqual(SHIPPED_TUNING.hud)
  })

  it('takes a picked colour in lower case, and refuses one that is not #rrggbb', () => {
    expect(parseTuning({ backdrop: '#ABCDEF' }).backdrop).toBe('#abcdef')
    expect(parseTuning({ backdrop: 'red' }).backdrop).toBe('lacquer-ink')
    expect(parseTuning({ backdrop: '#fff' }).backdrop).toBe('lacquer-ink')
  })

  it('reads a downloaded file through its tuning', () => {
    const file = tuningFileOf({
      backdropHex: '#ffffff',
      build: { commit: 'abc1234', version: '0.1.0' },
      savedAt: localMomentAt({
        day: 24,
        hour: 9,
        minute: 5,
        month: 11,
        year: 2026
      }),
      tuning: { ...SHIPPED_TUNING, backdrop: 'white' }
    })
    expect(parseTuning(JSON.parse(JSON.stringify(file))).backdrop).toBe('white')
  })
})

describe('backdropColorOf', () => {
  it('paints a preset through its token and a picked colour as it is', () => {
    expect(backdropColorOf('lacquer-ink')).toBe('var(--lacquer-ink)')
    expect(backdropColorOf('#123456')).toBe('#123456')
  })
})

describe('toneOfBackdrop', () => {
  const WHITE = { blue: 1, green: 1, red: 1 }
  const BLACK = { blue: 0, green: 0, red: 0 }
  const GREY = { blue: 0.53, green: 0.53, red: 0.53 }
  const LACQUER_INK = { blue: 0.1, green: 0.11, red: 0.12 }

  it('measures white as 1 and black as 0', () => {
    expect(relativeLuminanceOf(WHITE)).toBeCloseTo(1)
    expect(relativeLuminanceOf(BLACK)).toBe(0)
  })

  it.each([
    ['white', WHITE, 'light'],
    ['a mid grey', GREY, 'light'],
    ['lacquer ink', LACQUER_INK, 'dark'],
    ['black', BLACK, 'dark']
  ] as const)('gives %s the %s tone', (_, color, tone) => {
    expect(toneOfBackdrop(relativeLuminanceOf(color))).toBe(tone)
  })
})

describe('hexOf', () => {
  it('writes a colour as a colour input takes it', () => {
    expect(hexOf({ blue: 0, green: 0.5, red: 1 })).toBe('#ff8000')
  })
})

describe('tuningFileNameOf', () => {
  it('names the file after the local day and minute it was saved', () => {
    const savedAt = localMomentAt({
      day: 4,
      hour: 9,
      minute: 5,
      month: 11,
      year: 2026
    })
    expect(tuningFileNameOf(savedAt)).toBe('parallax-tune-2026-11-04-0905.json')
  })
})
