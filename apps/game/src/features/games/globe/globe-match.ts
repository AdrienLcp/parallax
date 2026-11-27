import type { SeatId } from '@parallax/protocol/identifiers'

import type { GlobeJudge } from './globe-atlas'
import type { GeoPoint } from './globe-distance'
import { GLOBE_PLACES, type GlobePlace } from './globe-places'
import { GLOBE_REACH, GLOBE_TUNING } from './globe-tuning'

/** The holder's stick: `x` east, `y` north, each from -1 to 1. */
export type GlobeStick = { readonly x: number; readonly y: number }

/** What the phones did since the last step. */
export type GlobeInput = {
  readonly plants: ReadonlySet<SeatId>
  /** Seats still in the room: a holder who left plants where the crosshair is. */
  readonly seated: ReadonlySet<SeatId>
  readonly sticks: ReadonlyMap<SeatId, GlobeStick>
  /** Each seat's second stick, from -1 (back out) to 1 (in). */
  readonly zooms: ReadonlyMap<SeatId, number>
}

/** A planted pin, judged. */
export type GlobeResult = {
  /** Where the arc ends; `null` for a pin inside its country. */
  readonly answer: GeoPoint | null
  readonly km: number
  readonly pin: GeoPoint
  readonly place: GlobePlace
  readonly points: number
  readonly seat: SeatId
}

export type GlobeView = {
  /**
   * Where the globe faces the players: the crosshair while aiming; during
   * the reveal, flying from the pin to halfway to the answer.
   */
  readonly aim: GeoPoint
  /** Seconds since the match began. */
  readonly elapsed: number
  /** The loupe's magnification while it is open; `null` while closed. */
  readonly loupe: number | null
  readonly outcome: { readonly winners: readonly SeatId[] } | null
  readonly phase: 'aiming' | 'reveal' | 'decided'
  /** The last pin, while it is shown. */
  readonly result: GlobeResult | null
  /** Seconds since the reveal began; 0 otherwise. */
  readonly revealElapsed: number
  readonly scores: ReadonlyMap<SeatId, number>
  /** The turn being aimed; `null` during the reveal and once decided. */
  readonly turn: {
    readonly place: GlobePlace
    readonly seat: SeatId
    readonly secondsLeft: number
  } | null
  readonly turns: { readonly of: number; readonly played: number }
  /** How far the second stick has opened the loupe, from 0 to 1. */
  readonly zoom: number
}

export type GlobeMatch = {
  /** Steps the game by `seconds`; answers `true` once it is over and its result has been shown. */
  advance: (input: GlobeInput, seconds: number) => boolean
  view: () => GlobeView
}

/** Below this the loupe is shut: a slight touch of the second stick does not open it. */
export const LOUPE_OPENS = 0.03

const KINDS = ['country', 'city', 'monument', 'mountain'] as const
/** How often each tier comes up: mostly places an office knows. */
const TIER_WEIGHTS = { easy: 0.5, hard: 0.15, medium: 0.35 } as const

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const wrapLongitude = (longitude: number) =>
  ((((longitude + 180) % 360) + 360) % 360) - 180

const ease = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)

/**
 * The places of a match, one a turn, never twice: the kinds take turns from
 * a random start, so a holder gets a country, then a city, and so on, and the
 * tiers are drawn by `TIER_WEIGHTS`.
 */
export const drawGlobePlaces = ({
  count,
  places = GLOBE_PLACES,
  random
}: {
  count: number
  places?: readonly GlobePlace[]
  random: () => number
}): GlobePlace[] => {
  const offset = Math.floor(random() * KINDS.length)
  const drawn: GlobePlace[] = []
  const taken = new Set<string>()
  for (let turn = 0; turn < count; turn += 1) {
    const kind = KINDS[(offset + turn) % KINDS.length]
    const pool = places.filter(
      (place) => place.kind === kind && !taken.has(place.id)
    )
    const roll = random()
    const tier =
      roll < TIER_WEIGHTS.easy
        ? 'easy'
        : roll < TIER_WEIGHTS.easy + TIER_WEIGHTS.medium
          ? 'medium'
          : 'hard'
    const inTier = pool.filter((place) => place.tier === tier)
    const from = inTier.length > 0 ? inTier : pool
    const place = from[Math.floor(random() * from.length)]
    if (place === undefined) continue
    taken.add(place.id)
    drawn.push(place)
  }
  return drawn
}

/** What a pin this far, planted `elapsed` seconds into its turn, earns. */
export const pointsFor = ({
  elapsed,
  km,
  kind
}: {
  elapsed: number
  km: number
  kind: GlobePlace['kind']
}): number => {
  const { fullPayKm, zeroPayKm } = GLOBE_REACH[kind]
  const distanceShare = clamp(
    1 - (km - fullPayKm) / (zeroPayKm - fullPayKm),
    0,
    1
  )
  const clockShare =
    1 - GLOBE_TUNING.timeShare * clamp(elapsed / GLOBE_TUNING.turnSeconds, 0, 1)
  return Math.round(GLOBE_TUNING.mostPoints * distanceShare * clockShare)
}

/** The point halfway along the great circle between two points. */
const midpointOf = (a: GeoPoint, b: GeoPoint): GeoPoint => {
  const toVector = ({ latitude, longitude }: GeoPoint) => {
    const phi = (latitude * Math.PI) / 180
    const lambda = (longitude * Math.PI) / 180
    return [
      Math.cos(phi) * Math.cos(lambda),
      Math.cos(phi) * Math.sin(lambda),
      Math.sin(phi)
    ] as const
  }
  const [ax, ay, az] = toVector(a)
  const [bx, by, bz] = toVector(b)
  const x = ax + bx
  const y = ay + by
  const z = az + bz
  const length = Math.hypot(x, y, z)
  if (length < 1e-9) return a
  return {
    latitude: (Math.asin(z / length) * 180) / Math.PI,
    longitude: (Math.atan2(y, x) * 180) / Math.PI
  }
}

/**
 * Terre: the seats hold the globe in turns, `turnsEach` times each. A turn
 * names a place; its holder pushes the crosshair over the ground with the
 * stick (the globe coasts once it lets go), opens the loupe with the second
 * stick, and plants. A pin pays for how near it landed and how soon.
 */
export const createGlobeMatch = ({
  judge,
  places,
  random,
  seats
}: {
  judge: GlobeJudge
  /** One a turn, in order; drawn at random when left out. */
  places?: readonly GlobePlace[]
  random: () => number
  seats: readonly SeatId[]
}): GlobeMatch => {
  const of = seats.length * GLOBE_TUNING.turnsEach
  const asked = places ?? drawGlobePlaces({ count: of, random })
  const turnCount = Math.min(of, asked.length)
  const scores = new Map(seats.map((seat) => [seat, 0]))
  const aim = { latitude: 20, longitude: 10 }
  const speed = { east: 0, north: 0 }
  let zoom = 0
  let phase: GlobeView['phase'] = 'aiming'
  let played = 0
  let turnElapsed = 0
  let revealElapsed = 0
  let decidedElapsed = 0
  let elapsed = 0
  let result: GlobeResult | null = null
  let flightFrom: GeoPoint = { ...aim }
  let flightTo: GeoPoint = { ...aim }
  let outcome: GlobeView['outcome'] = null

  const holderOf = (turn: number) => seats[turn % seats.length]

  const magnifyOf = (level: number) =>
    GLOBE_TUNING.magnify.min +
    (GLOBE_TUNING.magnify.max - GLOBE_TUNING.magnify.min) *
      clamp((level - LOUPE_OPENS) / (1 - LOUPE_OPENS), 0, 1)

  const plant = (seat: SeatId, place: GlobePlace) => {
    const pin = { latitude: aim.latitude, longitude: aim.longitude }
    const { answer, km } = judge(place, pin)
    const points = pointsFor({ elapsed: turnElapsed, kind: place.kind, km })
    scores.set(seat, (scores.get(seat) ?? 0) + points)
    result = { answer, km, pin, place, points, seat }
    phase = 'reveal'
    revealElapsed = 0
    speed.east = 0
    speed.north = 0
    flightFrom = pin
    const middle = answer === null ? pin : midpointOf(pin, answer)
    flightTo = {
      latitude: clamp(
        middle.latitude,
        -GLOBE_TUNING.latitudeLimit,
        GLOBE_TUNING.latitudeLimit
      ),
      longitude: middle.longitude
    }
    played += 1
  }

  const decide = () => {
    phase = 'decided'
    decidedElapsed = 0
    const best = Math.max(0, ...scores.values())
    outcome = {
      winners:
        best === 0
          ? []
          : [...scores].filter(([, score]) => score === best).map(([s]) => s)
    }
  }

  const steer = (stick: GlobeStick | undefined, rate: number, dt: number) => {
    zoom = clamp(zoom + rate * GLOBE_TUNING.zoomSpeed * dt, 0, 1)
    // Through the loupe, the same push covers less ground.
    const slow = zoom > LOUPE_OPENS ? 1 / magnifyOf(zoom) : 1
    const length = stick === undefined ? 0 : Math.hypot(stick.x, stick.y)
    const scale = length > 1 ? 1 / length : 1
    speed.east += (stick?.x ?? 0) * scale * GLOBE_TUNING.push * slow * dt
    speed.north += (stick?.y ?? 0) * scale * GLOBE_TUNING.push * slow * dt
    const drag = Math.exp(-GLOBE_TUNING.drag * dt)
    speed.east *= drag
    speed.north *= drag
    const limit = GLOBE_TUNING.latitudeLimit
    aim.latitude = clamp(aim.latitude + speed.north * dt, -limit, limit)
    if (Math.abs(aim.latitude) >= limit) speed.north = 0
    // A degree of longitude is shorter away from the equator: the ground under the crosshair moves at the stick's pace.
    const cosine = Math.max(0.3, Math.cos((aim.latitude * Math.PI) / 180))
    aim.longitude = wrapLongitude(aim.longitude + (speed.east * dt) / cosine)
  }

  const nextTurn = () => {
    zoom = 0
    turnElapsed = 0
    result = null
    if (played >= turnCount) decide()
    else phase = 'aiming'
  }

  return {
    advance: (input, dt) => {
      elapsed += dt
      if (phase === 'aiming') {
        const seat = holderOf(played)
        const place = asked[played]
        if (seat === undefined || place === undefined) {
          decide()
          return false
        }
        turnElapsed += dt
        steer(input.sticks.get(seat), input.zooms.get(seat) ?? 0, dt)
        if (
          input.plants.has(seat) ||
          !input.seated.has(seat) ||
          turnElapsed >= GLOBE_TUNING.turnSeconds
        ) {
          plant(seat, place)
        }
        return false
      }
      if (phase === 'reveal') {
        revealElapsed += dt
        zoom = Math.max(0, zoom - dt * 2)
        const t = ease(clamp(revealElapsed / GLOBE_TUNING.flightSeconds, 0, 1))
        const turnLongitude = wrapLongitude(
          flightTo.longitude - flightFrom.longitude
        )
        aim.latitude =
          flightFrom.latitude + (flightTo.latitude - flightFrom.latitude) * t
        aim.longitude = wrapLongitude(flightFrom.longitude + turnLongitude * t)
        if (revealElapsed >= GLOBE_TUNING.revealSeconds) nextTurn()
        return false
      }
      decidedElapsed += dt
      return decidedElapsed >= GLOBE_TUNING.decidedPauseSeconds
    },
    view: () => {
      const seat = holderOf(played)
      const place = asked[played]
      return {
        aim: { latitude: aim.latitude, longitude: aim.longitude },
        elapsed,
        loupe:
          phase === 'aiming' && zoom > LOUPE_OPENS ? magnifyOf(zoom) : null,
        outcome,
        phase,
        result: phase === 'reveal' ? result : null,
        revealElapsed: phase === 'reveal' ? revealElapsed : 0,
        scores,
        turn:
          phase === 'aiming' && seat !== undefined && place !== undefined
            ? {
                place,
                seat,
                secondsLeft: Math.max(0, GLOBE_TUNING.turnSeconds - turnElapsed)
              }
            : null,
        turns: { of: turnCount, played },
        zoom
      }
    }
  }
}
