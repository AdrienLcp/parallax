import { geoContains } from 'd3-geo'
import type {
  Feature,
  FeatureCollection,
  Geometry,
  MultiLineString,
  Position
} from 'geojson'
import { feature, mesh, neighbors } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import atlasUrl from 'world-atlas/countries-50m.json?url'

import {
  COUNTRY_CODE_BY_ATLAS_ID,
  COUNTRY_CODE_BY_ATLAS_NAME,
  type CountryCode
} from './atlas-country-codes'
import {
  distanceToRingsKm,
  type GeoPoint,
  greatCircleKm,
  nearestPointOnRings,
  type Ring
} from './globe-distance'
import type { GlobePlace } from './globe-places'

type CountryProperties = { readonly name: string }
type CountryFeature = Feature<Geometry, CountryProperties>
type CountriesTopology = Topology<{
  countries: GeometryCollection<CountryProperties>
}>

/** How many land colours the map paints with, no two neighbours alike. */
export const LAND_COLOURS = 5

/** The world as the globe draws it and the game judges it. */
export type GlobeAtlas = {
  /** The borders between two countries, drawn finer than the coasts. */
  readonly borders: MultiLineString
  readonly coasts: MultiLineString
  /** Every shape of the atlas, with its land colour and its country, when it has one. */
  readonly countries: readonly {
    readonly code: CountryCode | null
    readonly colour: number
    readonly feature: CountryFeature
  }[]
}

/** Where a pin landed against the place asked for. */
export type GlobeJudgement = {
  /** Where the arc ends: the place's point, a country's nearest border; `null` for a pin inside its country. */
  readonly answer: GeoPoint | null
  /** 0 inside the country asked for. */
  readonly km: number
}

/** A pin's distance to a place, measured as the scores count it. */
export type GlobeJudge = (place: GlobePlace, pin: GeoPoint) => GlobeJudgement

const codeOf = (country: CountryFeature): CountryCode | null =>
  COUNTRY_CODE_BY_ATLAS_ID[String(country.id)] ??
  COUNTRY_CODE_BY_ATLAS_NAME[country.properties.name] ??
  null

/** Five colours, no two neighbours alike: greedy, most-bordered shapes first. */
const landColours = (adjacent: readonly (readonly number[])[]): number[] => {
  const colours = adjacent.map(() => -1)
  const order = adjacent
    .map((_, index) => index)
    .sort((a, b) => (adjacent[b]?.length ?? 0) - (adjacent[a]?.length ?? 0))
  for (const index of order) {
    const taken = new Set(
      (adjacent[index] ?? []).map((other) => colours[other])
    )
    for (let step = 0; step < LAND_COLOURS; step += 1) {
      const colour = (index + step) % LAND_COLOURS
      if (!taken.has(colour)) {
        colours[index] = colour
        break
      }
    }
    if (colours[index] === -1) colours[index] = index % LAND_COLOURS
  }
  return colours
}

/** Reads the atlas's TopoJSON into what the globe paints and judges. */
export const atlasOf = (topology: CountriesTopology): GlobeAtlas => {
  const shapes = topology.objects.countries
  const collection: FeatureCollection<Geometry, CountryProperties> = feature(
    topology,
    shapes
  )
  const colours = landColours(neighbors(shapes.geometries))
  return {
    borders: mesh(topology, shapes, (a, b) => a !== b),
    coasts: mesh(topology, shapes, (a, b) => a === b),
    countries: collection.features.map((country, index) => ({
      code: codeOf(country),
      colour: colours[index] ?? 0,
      feature: country
    }))
  }
}

let loading: Promise<GlobeAtlas> | null = null

/** The world atlas, fetched once (about 750 kB) and kept for every later game. */
export const loadGlobeAtlas = (): Promise<GlobeAtlas> => {
  loading ??= fetch(atlasUrl)
    .then(async (response): Promise<CountriesTopology> => response.json())
    .then(atlasOf)
  loading.catch(() => {
    loading = null
  })
  return loading
}

/** A shape's outlines, islands and holes alike, as the distances read them. */
export const ringsOf = (geometry: Geometry): Ring[] => {
  switch (geometry.type) {
    case 'Polygon':
      return geometry.coordinates.map(toRing)
    case 'MultiPolygon':
      return geometry.coordinates.flatMap((polygon) => polygon.map(toRing))
    default:
      return []
  }
}

const toRing = (ring: Position[]): Ring =>
  ring.map(([longitude = 0, latitude = 0]) => [longitude, latitude] as const)

/** Judges against the atlas: inside a country is 0 km, otherwise the way to its nearest border. */
export const createGlobeJudge = (atlas: GlobeAtlas): GlobeJudge => {
  const shapes = new Map<CountryCode, CountryFeature[]>()
  for (const { code, feature: shape } of atlas.countries) {
    if (code === null) continue
    shapes.set(code, [...(shapes.get(code) ?? []), shape])
  }
  return (place, pin) => {
    if (place.kind !== 'country') {
      return { answer: place.point, km: greatCircleKm(pin, place.point) }
    }
    const parts = shapes.get(place.country) ?? []
    const at: [number, number] = [pin.longitude, pin.latitude]
    if (parts.some((part) => geoContains(part, at))) {
      return { answer: null, km: 0 }
    }
    const rings = parts.flatMap((part) => ringsOf(part.geometry))
    return {
      answer: nearestPointOnRings(pin, rings),
      km: distanceToRingsKm(pin, rings)
    }
  }
}
