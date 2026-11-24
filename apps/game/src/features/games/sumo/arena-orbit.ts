import type { PlanarVector } from '@/helpers/planar-vector'

/** When the camera circles the drum: never, while the room waits, or always. */
export const ORBIT_MODES = ['off', 'waiting', 'always'] as const

export type OrbitMode = (typeof ORBIT_MODES)[number]

/** How the camera moves around the drum, so the alcove's depth shows as it turns. */
export type ArenaMotion = {
  readonly orbit: OrbitMode
  readonly orbitDegreesPerSecond: number
  /** How far the camera sways each way during play while it does not orbit; 0 holds it still. */
  readonly swayDegrees: number
}

export const SHIPPED_MOTION: ArenaMotion = {
  orbit: 'off',
  orbitDegreesPerSecond: 12,
  swayDegrees: 0
}

/** Where the camera stands around the drum, and how long it has been swaying. */
export type ArenaOrbit = {
  /** Radians around the drum's axis from the room's side, toward the room's right. */
  readonly azimuth: number
  readonly swaySeconds: number
}

export const STILL_ORBIT: ArenaOrbit = { azimuth: 0, swaySeconds: 0 }

/** Whether a match is being played on the drum, or it waits for one (the game choice's demo included). */
export type ArenaStage = 'playing' | 'waiting'

/** A sway never swings faster than one way and back in this long, however small. */
const SHORTEST_SWAY_SECONDS = 4

const radiansOf = (degrees: number) => (degrees * Math.PI) / 180

/** The same angle, between −π and π. */
const wrapped = (angle: number) =>
  angle - 2 * Math.PI * Math.floor((angle + Math.PI) / (2 * Math.PI))

const clamped = (value: number, reach: number) =>
  Math.max(-reach, Math.min(reach, value))

/**
 * Moves the camera around the drum by `seconds`. Orbiting, it turns at the
 * orbit speed. Otherwise it heads back to the room's side, by the shortest
 * way at up to twice that speed, and during play it sways about it: a sine
 * of the sway's amplitude whose fastest swing matches the orbit speed.
 */
export const advanceOrbit = (
  orbit: ArenaOrbit,
  {
    motion,
    seconds,
    stage
  }: { motion: ArenaMotion; seconds: number; stage: ArenaStage }
): ArenaOrbit => {
  const speed = radiansOf(motion.orbitDegreesPerSecond)
  const isOrbiting =
    motion.orbit === 'always' ||
    (motion.orbit === 'waiting' && stage === 'waiting')

  if (isOrbiting) {
    return { azimuth: wrapped(orbit.azimuth + speed * seconds), swaySeconds: 0 }
  }

  const amplitude = radiansOf(motion.swayDegrees)
  const isSwaying = stage === 'playing' && amplitude > 0
  const swaySeconds = isSwaying ? orbit.swaySeconds + seconds : 0
  const pace = Math.min(
    speed / amplitude,
    (2 * Math.PI) / SHORTEST_SWAY_SECONDS
  )
  const aim = isSwaying ? amplitude * Math.sin(swaySeconds * pace) : 0
  const gap = wrapped(aim - orbit.azimuth)
  return {
    azimuth: wrapped(orbit.azimuth + clamped(gap, 2 * speed * seconds)),
    swaySeconds
  }
}

/**
 * Turns a phone's stick, read as the room sees the display (`x` toward the
 * screen's right, `y` toward the viewer), into the arena's axes when the
 * camera stands `azimuth` radians around the drum: pushing up still sends the
 * top away from the viewer, and right still toward the screen's right.
 */
export const stickOnArena = (
  stick: PlanarVector,
  azimuth: number
): PlanarVector => {
  const cos = Math.cos(azimuth)
  const sin = Math.sin(azimuth)
  return {
    x: stick.x * cos + stick.y * sin,
    y: stick.y * cos - stick.x * sin
  }
}
