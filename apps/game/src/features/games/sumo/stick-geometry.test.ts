import { describe, expect, it } from 'vitest'

import { knobTurnsPerSecond, stickAnchor, stickReading } from './stick-geometry'

const PAD = { height: 300, width: 400 }

describe('stickAnchor', () => {
  it('settles under a thumb that lands well inside the pad', () => {
    expect(
      stickAnchor({ baseRadius: 50, pad: PAD, point: { x: 200, y: 150 } })
    ).toEqual({ x: 200, y: 150 })
  })

  it('pulls the base inside when the thumb lands by an edge', () => {
    expect(
      stickAnchor({ baseRadius: 50, pad: PAD, point: { x: 5, y: 299 } })
    ).toEqual({ x: 30, y: 270 })
  })
})

describe('stickReading', () => {
  it('reads a short push as a share of the travel', () => {
    expect(stickReading({ offset: { x: 30, y: 0 }, travel: 60 })).toEqual({
      knob: { x: 30, y: 0 },
      stick: { x: 0.5, y: 0 }
    })
  })

  it('stops the knob at the travel and the stick at length 1', () => {
    const { knob, stick } = stickReading({
      offset: { x: 0, y: -240 },
      travel: 60
    })
    expect(knob).toEqual({ x: 0, y: -60 })
    expect(stick).toEqual({ x: 0, y: -1 })
  })

  it('keeps the direction of a diagonal push past the travel', () => {
    const { stick } = stickReading({ offset: { x: 90, y: 90 }, travel: 60 })
    expect(stick.x).toBeCloseTo(Math.SQRT1_2)
    expect(stick.y).toBeCloseTo(Math.SQRT1_2)
  })

  it('reads nothing from a base not measured yet', () => {
    expect(stickReading({ offset: { x: 10, y: 10 }, travel: 0 })).toEqual({
      knob: { x: 0, y: 0 },
      stick: { x: 0, y: 0 }
    })
  })
})

describe('knobTurnsPerSecond', () => {
  it('turns faster the further the stick is pushed', () => {
    expect(knobTurnsPerSecond(1)).toBeGreaterThan(knobTurnsPerSecond(0))
    expect(knobTurnsPerSecond(0)).toBeGreaterThan(0)
  })
})
