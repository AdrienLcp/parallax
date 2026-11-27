import { MathUtils, Matrix4, Quaternion, Vector2, Vector3 } from 'three'

import type { AlcoveInterior } from '@/features/alcove/alcove-bounds'

/**
 * The two ways to fly a ship that the lab compares:
 * - `screen` — the sticks follow the display: the left one moves across and
 *   up, two buttons push in depth, the right one aims in the screen's plane
 *   and fires when pushed past half.
 * - `pilot` — the sticks follow the ship, as in a first-person game: the
 *   left one thrusts along the nose and strafes, the right one turns it
 *   (yaw round the vertical, pitch held short of straight up or down), a
 *   button fires along the nose.
 */
export type FlightMode = 'pilot' | 'screen'

export type FlightPad = {
  readonly depth: number
  readonly fire: boolean
  readonly left: { readonly x: number; readonly y: number }
  readonly right: { readonly x: number; readonly y: number }
}

export const IDLE_PAD: FlightPad = {
  depth: 0,
  fire: false,
  left: { x: 0, y: 0 },
  right: { x: 0, y: 0 }
}

export const FLIGHT = {
  /** Share of the ship's speed a bullet keeps. */
  bulletCarry: 0.4,
  bulletLife: 1.1,
  bulletRadius: 0.009,
  bulletSpeed: 1.7,
  deadZone: 0.18,
  depthThrust: 1.1,
  /** Damping per second: low, so the ship glides. */
  drag: 0.55,
  fireCooldown: 0.2,
  /** The right stick fires past this magnitude, in `screen`. */
  fireMagnitude: 0.6,
  maxSpeed: 0.95,
  pilotAssist: MathUtils.degToRad(12),
  pitchLimit: MathUtils.degToRad(80),
  /** Nose turn at full stick, in `pilot`, radians a second. */
  pitchRate: 1.9,
  recoil: 0.05,
  /** How far off the line a target still pulls the bullet to it. */
  screenAssist: MathUtils.degToRad(30),
  shipRadius: 0.034,
  step: 1 / 120,
  targetCount: 3,
  targetRadius: 0.032,
  targetRespawn: 0.9,
  thrust: 1.5,
  wallBounce: 0.55,
  yawRate: 2.3
} as const

export type Bounds = {
  readonly max: Vector3
  readonly min: Vector3
}

/** The room a ship's centre keeps: the interior minus its radius, the roof lowered clear of the lettering. */
export const flightBounds = (interior: AlcoveInterior): Bounds => ({
  max: new Vector3(
    interior.x.max - FLIGHT.shipRadius,
    interior.y.max - 0.13,
    interior.z.max - FLIGHT.shipRadius - 0.06
  ),
  min: new Vector3(
    interior.x.min + FLIGHT.shipRadius,
    FLIGHT.shipRadius * 1.4,
    interior.z.min + FLIGHT.shipRadius
  )
})

export type Bullet = {
  life: number
  readonly position: Vector3
  readonly velocity: Vector3
}

export type Target = {
  /** Seconds before it shows again, once hit; 0 while it floats. */
  away: number
  readonly home: Vector3
  readonly phase: number
  readonly position: Vector3
}

export type Burst = {
  readonly at: Vector3
  readonly kind: 'hit' | 'wall'
}

export type FlightWorld = {
  readonly bounds: Bounds
  readonly bullets: Bullet[]
  /** What happened since the last `drainBursts`, for the renderer's sparks. */
  readonly bursts: Burst[]
  cooldown: number
  hits: number
  readonly mode: FlightMode
  readonly ship: {
    /** Where the ship points: in the screen's plane in `screen`, anywhere in `pilot`. */
    readonly forward: Vector3
    pitch: number
    readonly position: Vector3
    /** 0 to 1: how hard it thrusts, for the flame. */
    thrust: number
    readonly velocity: Vector3
    yaw: number
  }
  shots: number
  readonly targets: Target[]
  time: number
}

/** A stick past its deadZone, rescaled to start from 0, `y` turned to grow upwards. */
export const liveStick = ({ x, y }: { x: number; y: number }): Vector2 => {
  const stick = new Vector2(x, -y)
  const length = stick.length()
  if (length < FLIGHT.deadZone) return stick.set(0, 0)
  return stick.multiplyScalar(
    Math.min(1, (length - FLIGHT.deadZone) / (1 - FLIGHT.deadZone)) / length
  )
}

/** The nose's direction for a yaw (0 looks into the alcove, positive turns right) and a pitch (positive looks up). */
export const noseOf = (yaw: number, pitch: number): Vector3 =>
  new Vector3(
    Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    -Math.cos(yaw) * Math.cos(pitch)
  )

const placeTarget = (target: Target, bounds: Bounds, seed: number) => {
  const share = (value: number) => (Math.sin(value) + 1) / 2
  target.home.set(
    MathUtils.lerp(bounds.min.x + 0.05, bounds.max.x - 0.05, share(seed * 3.1)),
    MathUtils.lerp(bounds.min.y + 0.15, bounds.max.y - 0.1, share(seed * 1.7)),
    MathUtils.lerp(bounds.min.z + 0.03, bounds.max.z - 0.03, share(seed * 2.3))
  )
  target.position.copy(target.home)
}

export const createFlightWorld = (
  mode: FlightMode,
  interior: AlcoveInterior
): FlightWorld => {
  const bounds = flightBounds(interior)
  const targets = Array.from({ length: FLIGHT.targetCount }, (_, index) => {
    const target: Target = {
      away: 0,
      home: new Vector3(),
      phase: index * 2.1,
      position: new Vector3()
    }
    placeTarget(target, bounds, index + 1)
    return target
  })
  const world: FlightWorld = {
    bounds,
    bullets: [],
    bursts: [],
    cooldown: 0,
    hits: 0,
    mode,
    ship: {
      forward: new Vector3(0, 1, 0),
      pitch: 0,
      position: new Vector3(),
      thrust: 0,
      velocity: new Vector3(),
      yaw: 0
    },
    shots: 0,
    targets,
    time: 0
  }
  resetShip(world)
  return world
}

export const resetShip = (world: FlightWorld): void => {
  const { bounds, ship } = world
  ship.position.set(
    0,
    MathUtils.lerp(bounds.min.y, bounds.max.y, 0.3),
    MathUtils.lerp(bounds.min.z, bounds.max.z, 0.5)
  )
  ship.velocity.set(0, 0, 0)
  ship.yaw = 0
  ship.pitch = 0
  ship.forward.copy(
    world.mode === 'pilot' ? noseOf(0, 0) : new Vector3(0, 1, 0)
  )
}

const bounce = (position: Vector3, velocity: Vector3, bounds: Bounds) => {
  for (const axis of ['x', 'y', 'z'] as const) {
    if (position[axis] < bounds.min[axis]) {
      position[axis] = bounds.min[axis]
      if (velocity[axis] < 0) velocity[axis] *= -FLIGHT.wallBounce
    }
    if (position[axis] > bounds.max[axis]) {
      position[axis] = bounds.max[axis]
      if (velocity[axis] > 0) velocity[axis] *= -FLIGHT.wallBounce
    }
  }
}

/** The live target closest to the line from `from` along `direction`, within `cone`, or `null`. */
const targetAlong = (
  world: FlightWorld,
  from: Vector3,
  direction: Vector3,
  cone: number,
  inPlane: boolean
): Target | null => {
  let best: Target | null = null
  let bestCos = Math.cos(cone)
  for (const target of world.targets) {
    if (target.away > 0) continue
    const to = target.position.clone().sub(from)
    if (inPlane) to.z = 0
    const length = to.length()
    if (length < 1e-3) continue
    const cosine = to.divideScalar(length).dot(direction)
    if (cosine > bestCos) {
      bestCos = cosine
      best = target
    }
  }
  return best
}

const fire = (world: FlightWorld) => {
  const { ship } = world
  const direction = ship.forward.clone().normalize()
  const nose = ship.position.clone().addScaledVector(direction, 0.05)
  const velocity = direction
    .clone()
    .multiplyScalar(FLIGHT.bulletSpeed)
    .addScaledVector(ship.velocity, FLIGHT.bulletCarry)

  if (world.mode === 'screen') {
    // Depth aim assist: the bullet takes the current depth of the best-aligned target, without lead.
    const target = targetAlong(
      world,
      nose,
      direction,
      FLIGHT.screenAssist,
      true
    )
    if (target !== null) {
      const across = Math.hypot(
        target.position.x - nose.x,
        target.position.y - nose.y
      )
      velocity.z =
        ((target.position.z - nose.z) / (across / FLIGHT.bulletSpeed)) * 0.95
    }
  } else {
    // A narrower pull toward a target near the nose's line.
    const target = targetAlong(
      world,
      nose,
      direction,
      FLIGHT.pilotAssist,
      false
    )
    if (target !== null) {
      velocity
        .copy(target.position)
        .sub(nose)
        .setLength(FLIGHT.bulletSpeed)
        .addScaledVector(ship.velocity, FLIGHT.bulletCarry)
    }
  }

  world.bullets.push({ life: FLIGHT.bulletLife, position: nose, velocity })
  ship.velocity.addScaledVector(direction, -FLIGHT.recoil)
  world.cooldown = FLIGHT.fireCooldown
  world.shots += 1
}

const steer = (world: FlightWorld, pad: FlightPad, dt: number): boolean => {
  const { ship } = world
  const move = liveStick(pad.left)
  const aim = liveStick(pad.right)

  if (world.mode === 'screen') {
    ship.thrust = move.length()
    ship.velocity.x += move.x * FLIGHT.thrust * dt
    ship.velocity.y += move.y * FLIGHT.thrust * dt
    // Forward pushes into the alcove, away from the players.
    ship.velocity.z -=
      MathUtils.clamp(pad.depth, -1, 1) * FLIGHT.depthThrust * dt
    if (aim.lengthSq() > 0.25) {
      ship.forward.set(aim.x, aim.y, 0).normalize()
    } else if (ship.thrust > 0.3) {
      ship.forward
        .lerp(new Vector3(move.x, move.y, 0).normalize(), Math.min(1, dt * 4))
        .normalize()
    }
    return aim.length() > FLIGHT.fireMagnitude
  }

  ship.yaw += aim.x * FLIGHT.yawRate * dt
  ship.pitch = MathUtils.clamp(
    ship.pitch + aim.y * FLIGHT.pitchRate * dt,
    -FLIGHT.pitchLimit,
    FLIGHT.pitchLimit
  )
  ship.forward.copy(noseOf(ship.yaw, ship.pitch))
  const right = new Vector3(Math.cos(ship.yaw), 0, Math.sin(ship.yaw))
  ship.thrust = Math.max(move.y, 0) + Math.abs(move.x) * 0.5
  ship.velocity
    .addScaledVector(ship.forward, move.y * FLIGHT.thrust * dt)
    .addScaledVector(right, move.x * FLIGHT.thrust * dt)
  return pad.fire
}

const stepOnce = (world: FlightWorld, pad: FlightPad, dt: number) => {
  const { bounds, ship } = world
  world.time += dt
  const wantsFire = steer(world, pad, dt)
  ship.velocity.multiplyScalar(Math.exp(-FLIGHT.drag * dt))
  if (ship.velocity.length() > FLIGHT.maxSpeed) {
    ship.velocity.setLength(FLIGHT.maxSpeed)
  }
  ship.position.addScaledVector(ship.velocity, dt)
  bounce(ship.position, ship.velocity, bounds)

  world.cooldown -= dt
  if (wantsFire && world.cooldown <= 0) fire(world)

  for (const target of world.targets) {
    if (target.away > 0) {
      target.away -= dt
      if (target.away <= 0) {
        placeTarget(target, bounds, world.time * 0.73 + target.phase)
      }
      continue
    }
    const t = world.time * 0.6 + target.phase
    target.position.set(
      target.home.x + Math.sin(t) * 0.06,
      target.home.y + Math.sin(t * 1.3) * 0.05,
      target.home.z + Math.cos(t * 0.8) * 0.12
    )
    bounce(target.position, new Vector3(), bounds)
  }

  const inside = {
    max: bounds.max.clone().addScalar(FLIGHT.shipRadius - FLIGHT.bulletRadius),
    min: bounds.min.clone().addScalar(FLIGHT.bulletRadius - FLIGHT.shipRadius)
  }
  for (let index = world.bullets.length - 1; index >= 0; index -= 1) {
    const bullet = world.bullets[index]
    if (bullet === undefined) continue
    bullet.life -= dt
    bullet.position.addScaledVector(bullet.velocity, dt)
    const isOut =
      bullet.position.x < inside.min.x ||
      bullet.position.x > inside.max.x ||
      bullet.position.y < inside.min.y ||
      bullet.position.y > inside.max.y + 0.13 ||
      bullet.position.z < inside.min.z ||
      bullet.position.z > inside.max.z + 0.06
    let isGone = bullet.life <= 0 || isOut
    if (isOut) world.bursts.push({ at: bullet.position.clone(), kind: 'wall' })
    if (!isGone) {
      for (const target of world.targets) {
        if (target.away > 0) continue
        if (
          target.position.distanceTo(bullet.position) >
          FLIGHT.targetRadius + FLIGHT.bulletRadius
        ) {
          continue
        }
        isGone = true
        target.away = FLIGHT.targetRespawn
        world.hits += 1
        world.bursts.push({ at: target.position.clone(), kind: 'hit' })
        break
      }
    }
    if (isGone) world.bullets.splice(index, 1)
  }
}

/** Runs the world `seconds` forward at a fixed step, the pad held throughout. */
export const advanceFlight = (
  world: FlightWorld,
  pad: FlightPad,
  seconds: number
): void => {
  let left = Math.min(seconds, 0.05)
  while (left > 1e-6) {
    const dt = Math.min(left, FLIGHT.step)
    stepOnce(world, pad, dt)
    left -= dt
  }
}

/** The ship's attitude for its model, whose nose is local +Y and whose top is local +Z. */
export const shipAttitude = (world: FlightWorld): Quaternion => {
  const { ship } = world
  const forward = ship.forward.clone().normalize()
  const up =
    world.mode === 'pilot'
      ? noseOf(ship.yaw, ship.pitch + Math.PI / 2)
      : new Vector3(0, 0, 1)
  const right = new Vector3().crossVectors(forward, up).normalize()
  up.crossVectors(right, forward).normalize()
  const basis = new Quaternion().setFromRotationMatrix(
    new Matrix4().makeBasis(right, forward, up)
  )
  if (world.mode === 'screen') {
    // Pitch with the depth speed, as the mock does.
    const tilt = MathUtils.clamp(-ship.velocity.z * 2, -0.7, 0.7)
    basis.multiply(
      new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), tilt)
    )
  }
  return basis
}
