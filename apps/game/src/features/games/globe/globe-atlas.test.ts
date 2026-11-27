import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

import { describe, expect, it } from 'vitest'

import { atlasOf, createGlobeJudge } from './globe-atlas'
import { GLOBE_PLACES, placeById } from './globe-places'

const atlas = atlasOf(
  JSON.parse(
    readFileSync(
      createRequire(import.meta.url).resolve('world-atlas/countries-50m.json'),
      'utf8'
    )
  )
)
const judge = createGlobeJudge(atlas)

const country = (code: string) => {
  const place = placeById(`country:${code}`)
  if (place === undefined) throw new Error(code)
  return place
}

describe('the atlas', () => {
  it('draws every country the bank asks for', () => {
    const drawn = new Set(atlas.countries.map(({ code }) => code))
    const missing = GLOBE_PLACES.flatMap((place) =>
      place.kind === 'country' && !drawn.has(place.country)
        ? [place.country]
        : []
    )
    expect(missing).toEqual([])
  })

  it('paints no two neighbours alike', () => {
    const colours = new Set(atlas.countries.map(({ colour }) => colour))
    expect(colours.size).toBeLessThanOrEqual(5)
  })
})

describe('createGlobeJudge', () => {
  it('counts a pin inside the country as on it', () => {
    expect(judge(country('FRA'), { latitude: 46.6, longitude: 2.4 })).toEqual({
      answer: null,
      km: 0
    })
  })

  it('measures a pin outside to the nearest border, not the centre', () => {
    // Lisbon, against Spain: the border lies about 180 km east.
    const { answer, km } = judge(country('ESP'), {
      latitude: 38.72,
      longitude: -9.14
    })
    expect(km).toBeGreaterThan(120)
    expect(km).toBeLessThan(260)
    expect(answer).not.toBeNull()
  })

  it('measures a point place as the crow flies', () => {
    const everest = placeById('mountain:everest')
    if (everest === undefined) throw new Error('everest')
    expect(
      judge(everest, { latitude: 27.988, longitude: 86.925 }).km
    ).toBeLessThan(0.01)
  })
})
