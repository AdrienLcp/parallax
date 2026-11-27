import type { GlobePlaceKind } from '@parallax/protocol/globe'

import type { Locale } from '@/presentation/i18n/locale'

import type { CountryCode } from './atlas-country-codes'
import type { GeoPoint } from './globe-distance'
import {
  CITY_ROWS,
  COUNTRY_ROWS,
  MONUMENT_ROWS,
  MOUNTAIN_ROWS,
  type PlaceTier
} from './globe-place-rows'

/** A place a turn may ask for: a country is found by its shape, anything else by its point. */
export type GlobePlace = {
  /** Unique across kinds, `<kind>:<slug>`: what `globe.state` names it by. */
  readonly id: string
  readonly kind: GlobePlaceKind
  readonly names: Readonly<Record<Locale, string>>
  readonly tier: PlaceTier
} & (
  | { readonly country: CountryCode; readonly kind: 'country' }
  | {
      readonly kind: Exclude<GlobePlaceKind, 'country'>
      readonly point: GeoPoint
    }
)

const pointPlaces = (
  kind: Exclude<GlobePlaceKind, 'country'>,
  rows: typeof CITY_ROWS
): GlobePlace[] =>
  rows.map(([slug, fr, en, tier, latitude, longitude]) => ({
    id: `${kind}:${slug}`,
    kind,
    names: { en, fr },
    point: { latitude, longitude },
    tier
  }))

/** Every place Terre asks for, whatever the kind. */
export const GLOBE_PLACES: readonly GlobePlace[] = [
  ...COUNTRY_ROWS.map(
    ([code, fr, en, tier]): GlobePlace => ({
      country: code,
      id: `country:${code}`,
      kind: 'country',
      names: { en, fr },
      tier
    })
  ),
  ...pointPlaces('city', CITY_ROWS),
  ...pointPlaces('monument', MONUMENT_ROWS),
  ...pointPlaces('mountain', MOUNTAIN_ROWS)
]

const PLACE_BY_ID = new Map(GLOBE_PLACES.map((place) => [place.id, place]))

/** The place `globe.state` names, or `undefined` for an id this build does not know. */
export const placeById = (id: string): GlobePlace | undefined =>
  PLACE_BY_ID.get(id)
