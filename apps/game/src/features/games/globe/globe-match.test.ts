import { describe, expect, it } from 'vitest'

import { type SeatId, seatIdSchema } from '@parallax/protocol/identifiers'

import type { GlobeJudge } from './globe-atlas'
import { greatCircleKm } from './globe-distance'
import {
  createGlobeMatch,
  drawGlobePlaces,
  type GlobeInput,
  pointsFor
} from './globe-match'
import { GLOBE_PLACES, type GlobePlace } from './globe-places'
import { GLOBE_TUNING } from './globe-tuning'

const STEP = 1 / 120
const A = seatIdSchema.parse('seat-a')
const B = seatIdSchema.parse('seat-b')

/** Every place is a point at the match's starting aim, judged as the crow flies. */
const judge: GlobeJudge = (place, pin) =>
  place.kind === 'country'
    ? { answer: null, km: 0 }
    : { answer: place.point, km: greatCircleKm(pin, place.point) }

const placeAt = (latitude: number, longitude: number): GlobePlace => ({
  id: `city:test-${latitude}-${longitude}`,
  kind: 'city',
  names: { en: 'Test', fr: 'Test' },
  point: { latitude, longitude },
  tier: 'easy'
})

const quiet = (seated: readonly SeatId[] = [A, B]): GlobeInput => ({
  plants: new Set(),
  seated: new Set(seated),
  sticks: new Map(),
  zooms: new Map()
})

const run = (
  match: ReturnType<typeof createGlobeMatch>,
  seconds: number,
  input: GlobeInput = quiet()
) => {
  let isOver = false
  for (let t = 0; t < seconds && !isOver; t += STEP) {
    isOver = match.advance(input, STEP)
  }
  return isOver
}

describe('pointsFor', () => {
  it('pays the whole turn for a pin inside its country planted at once', () => {
    expect(pointsFor({ elapsed: 0, kind: 'country', km: 0 })).toBe(1000)
  })

  it('pays half of it for the same pin at the last moment', () => {
    expect(
      pointsFor({
        elapsed: GLOBE_TUNING.turnSeconds,
        kind: 'country',
        km: 0
      })
    ).toBe(500)
  })

  it('pays a city in full within 100 km and nothing past 1,000', () => {
    expect(pointsFor({ elapsed: 0, kind: 'city', km: 80 })).toBe(1000)
    expect(pointsFor({ elapsed: 0, kind: 'city', km: 550 })).toBe(500)
    expect(pointsFor({ elapsed: 0, kind: 'city', km: 1200 })).toBe(0)
  })
})

describe('drawGlobePlaces', () => {
  it('takes the kinds in turn and never asks twice', () => {
    let seed = 1
    const random = () => {
      seed = (seed * 16807) % 2147483647
      return seed / 2147483647
    }
    const drawn = drawGlobePlaces({ count: 24, random })
    expect(new Set(drawn.map((place) => place.id)).size).toBe(24)
    const kinds = drawn.map((place) => place.kind)
    for (let turn = 4; turn < kinds.length; turn += 1) {
      expect(kinds[turn]).toBe(kinds[turn - 4])
    }
    expect(new Set(kinds.slice(0, 4)).size).toBe(4)
  })

  it('stands every place where the crosshair can reach', () => {
    for (const place of GLOBE_PLACES) {
      if (place.kind === 'country') continue
      expect(Math.abs(place.point.latitude)).toBeLessThanOrEqual(
        GLOBE_TUNING.latitudeLimit
      )
    }
  })
})

describe('createGlobeMatch', () => {
  it('pays the holder a pin planted on the place at once', () => {
    const match = createGlobeMatch({
      judge,
      places: [placeAt(20, 10), placeAt(0, 0)],
      random: Math.random,
      seats: [A, B]
    })
    match.advance({ ...quiet(), plants: new Set([A]) }, STEP)

    const view = match.view()
    expect(view.phase).toBe('reveal')
    expect(view.result?.seat).toBe(A)
    expect(view.result?.km).toBeLessThan(1)
    expect(view.scores.get(A)).toBe(1000)
  })

  it('ignores a plant from a seat that does not hold the globe', () => {
    const match = createGlobeMatch({
      judge,
      places: [placeAt(20, 10)],
      random: Math.random,
      seats: [A, B]
    })
    match.advance({ ...quiet(), plants: new Set([B]) }, STEP)

    expect(match.view().phase).toBe('aiming')
  })

  it('moves the crosshair east under a stick pushed right, and coasts once let go', () => {
    const match = createGlobeMatch({
      judge,
      places: [placeAt(0, 0)],
      random: Math.random,
      seats: [A]
    })
    const start = match.view().aim.longitude
    run(match, 1, { ...quiet([A]), sticks: new Map([[A, { x: 1, y: 0 }]]) })
    const pushed = match.view().aim.longitude
    run(match, 0.5, quiet([A]))
    const coasted = match.view().aim.longitude

    expect(pushed).toBeGreaterThan(start + 20)
    expect(coasted).toBeGreaterThan(pushed + 5)
    expect(match.view().aim.latitude).toBeCloseTo(20, 5)
  })

  it('moves slower through the loupe', () => {
    const plain = createGlobeMatch({
      judge,
      places: [placeAt(0, 0)],
      random: Math.random,
      seats: [A]
    })
    const zoomed = createGlobeMatch({
      judge,
      places: [placeAt(0, 0)],
      random: Math.random,
      seats: [A]
    })
    run(zoomed, 1.5, { ...quiet([A]), zooms: new Map([[A, 1]]) })
    expect(zoomed.view().loupe).toBe(GLOBE_TUNING.magnify.max)
    const before = zoomed.view().aim.longitude
    const push = { ...quiet([A]), sticks: new Map([[A, { x: 1, y: 0 }]]) }
    run(plain, 1, push)
    run(zoomed, 1, push)

    expect(zoomed.view().aim.longitude - before).toBeLessThan(
      (plain.view().aim.longitude - 10) / 5
    )
  })

  it('stops the crosshair short of the poles', () => {
    const match = createGlobeMatch({
      judge,
      places: [placeAt(0, 0)],
      random: Math.random,
      seats: [A]
    })
    run(match, 6, { ...quiet([A]), sticks: new Map([[A, { x: 0, y: 1 }]]) })

    expect(match.view().aim.latitude).toBe(GLOBE_TUNING.latitudeLimit)
  })

  it('plants by itself when the clock runs out, for half the points at most', () => {
    const match = createGlobeMatch({
      judge,
      places: [placeAt(20, 10)],
      random: Math.random,
      seats: [A]
    })
    run(match, GLOBE_TUNING.turnSeconds + STEP, quiet([A]))

    expect(match.view().phase).toBe('reveal')
    expect(match.view().scores.get(A)).toBe(500)
  })

  it('hands the globe round, each seat its share of turns, then names the best', () => {
    const places = Array.from({ length: 6 }, (_, turn) =>
      placeAt(20, 10 + turn)
    )
    const match = createGlobeMatch({
      judge,
      places,
      random: Math.random,
      seats: [A, B]
    })
    const holders: SeatId[] = []
    let isOver = false
    for (let turn = 0; turn < 6; turn += 1) {
      const seat = match.view().turn?.seat
      if (seat === undefined) throw new Error('no turn')
      holders.push(seat)
      match.advance({ ...quiet(), plants: new Set([seat]) }, STEP)
      isOver = run(match, GLOBE_TUNING.revealSeconds + STEP)
    }

    expect(holders).toEqual([A, B, A, B, A, B])
    expect(match.view().phase).toBe('decided')
    expect(match.view().outcome?.winners).toEqual([A])
    expect(isOver).toBe(false)
    expect(run(match, GLOBE_TUNING.decidedPauseSeconds + STEP)).toBe(true)
  })

  it('turns the globe during the reveal to halfway between the pin and the answer', () => {
    const match = createGlobeMatch({
      judge,
      places: [placeAt(20, 50)],
      random: Math.random,
      seats: [A]
    })
    match.advance({ ...quiet([A]), plants: new Set([A]) }, STEP)
    run(match, GLOBE_TUNING.flightSeconds + STEP, quiet([A]))

    const { aim } = match.view()
    expect(aim.longitude).toBeGreaterThan(25)
    expect(aim.longitude).toBeLessThan(35)
  })
})
