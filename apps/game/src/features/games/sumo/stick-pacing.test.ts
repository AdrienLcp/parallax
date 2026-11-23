import { describe, expect, it } from 'vitest'

import { hasStickMoved, steppedStick } from './stick-pacing'

describe('steppedStick', () => {
  it('rounds each axis to the step grid', () => {
    expect(steppedStick({ x: 0.333, y: -0.776 })).toEqual({ x: 0.34, y: -0.78 })
  })

  it('keeps each axis within -1 and 1', () => {
    expect(steppedStick({ x: 1.4, y: -3 })).toEqual({ x: 1, y: -1 })
  })
})

describe('hasStickMoved', () => {
  it('sends the first stick, even at rest', () => {
    expect(hasStickMoved(null, { x: 0, y: 0 })).toBe(true)
  })

  it('stays quiet for a move finer than the step', () => {
    expect(hasStickMoved({ x: 0.5, y: 0.5 }, { x: 0.505, y: 0.495 })).toBe(
      false
    )
  })

  it('sends a move of one step', () => {
    expect(hasStickMoved({ x: 0.5, y: 0.5 }, { x: 0.52, y: 0.5 })).toBe(true)
  })
})
