import type RAPIER from '@dimforge/rapier3d-compat'

import type { TowerBlock } from '@parallax/protocol/tower'

import type { AlcoveInterior } from '@/features/alcove/alcove-bounds'

import {
  ARCH_LEG,
  ARCH_LINTEL,
  blockHull,
  blockSize,
  type Point,
  triangleSpan
} from './tower-blocks'
import { TOWER_STEP_SECONDS, TOWER_TUNING } from './tower-tuning'

export type Rapier = typeof RAPIER

export type Quaternion = {
  readonly w: number
  readonly x: number
  readonly y: number
  readonly z: number
}

export type BlockPose = {
  readonly position: Point
  readonly quaternion: Quaternion
}

/** A block let go: its shape, its size unit, where its centre starts and how it is turned. */
export type DroppedBlock = {
  readonly kind: TowerBlock
  readonly u: number
  readonly x: number
  readonly y: number
  readonly yaw: number
  readonly z: number
}

/** The wooden blocks falling and standing in the alcove, the floor and the interior's walls around them. */
export type TowerPhysics = {
  /** Lets a block go, still, and answers its handle. */
  drop: (block: DroppedBlock) => number
  dispose: () => void
  /** Whether the block has come to rest. */
  isStill: (handle: number) => boolean
  pose: (handle: number) => BlockPose
  /** How low and how high the block reaches as it lies now. */
  reach: (handle: number) => { readonly bottom: number; readonly top: number }
  remove: (handle: number) => void
  /** Steps the world by one fixed step. */
  step: () => void
  /** The height of the first surface under a point, the floor at worst. */
  surfaceBelow: (point: Point) => number
}

const FRICTION = 0.8
const RESTITUTION = 0.02
const WALL_HALF = 0.05

export const rotate = (q: Quaternion, p: Point): Point => {
  // p + 2w(q×p) + 2q×(q×p)
  const cx = q.y * p.z - q.z * p.y
  const cy = q.z * p.x - q.x * p.z
  const cz = q.x * p.y - q.y * p.x
  return {
    x: p.x + 2 * (q.w * cx + q.y * cz - q.z * cy),
    y: p.y + 2 * (q.w * cy + q.z * cx - q.x * cz),
    z: p.z + 2 * (q.w * cz + q.x * cy - q.y * cx)
  }
}

export const yawQuaternion = (yaw: number): Quaternion => ({
  w: Math.cos(yaw / 2),
  x: 0,
  y: Math.sin(yaw / 2),
  z: 0
})

const colliders = (
  rapier: Rapier,
  kind: TowerBlock,
  u: number
): RAPIER.ColliderDesc[] => {
  const { d, h, w } = blockSize(kind, u)
  switch (kind) {
    case 'plank':
    case 'cube':
      return [rapier.ColliderDesc.cuboid(w / 2, h / 2, d / 2)]
    case 'cylinder':
      return [rapier.ColliderDesc.cylinder(h / 2, w / 2)]
    case 'arch': {
      const leg = ARCH_LEG * u
      const lintel = ARCH_LINTEL * u
      const legHeight = h - lintel
      const legY = -h / 2 + legHeight / 2
      return [
        rapier.ColliderDesc.cuboid(
          leg / 2,
          legHeight / 2,
          d / 2
        ).setTranslation(-w / 2 + leg / 2, legY, 0),
        rapier.ColliderDesc.cuboid(
          leg / 2,
          legHeight / 2,
          d / 2
        ).setTranslation(w / 2 - leg / 2, legY, 0),
        rapier.ColliderDesc.cuboid(w / 2, lintel / 2, d / 2).setTranslation(
          0,
          h / 2 - lintel / 2,
          0
        )
      ]
    }
    case 'triangle': {
      const { apex, base } = triangleSpan(h)
      const hull = rapier.ColliderDesc.convexHull(
        new Float32Array(
          (
            [
              [-w / 2, base],
              [w / 2, base],
              [0, apex]
            ] as const
          ).flatMap(([x, y]) => [x, y, -d / 2, x, y, d / 2])
        )
      )
      return hull === null ? [] : [hull]
    }
    default:
      return kind satisfies never
  }
}

/**
 * The alcove's physics, on Rapier: the floor, invisible walls on `interior`
 * (its sides, back, roof and the floor's front edge, so a falling block stops
 * short of the alcove's edges as every object does), and the blocks dropped
 * in it. `rapier` must be initialised.
 */
export const createTowerPhysics = (
  rapier: Rapier,
  interior: AlcoveInterior
): TowerPhysics => {
  const world = new rapier.World({ x: 0, y: -TOWER_TUNING.gravity, z: 0 })
  world.timestep = TOWER_STEP_SECONDS
  world.lengthUnit = 0.1
  world.numSolverIterations = 8

  const fixed = (half: Point, centre: Point): void => {
    world.createCollider(
      rapier.ColliderDesc.cuboid(half.x, half.y, half.z)
        .setTranslation(centre.x, centre.y, centre.z)
        .setFriction(FRICTION)
    )
  }
  const width = interior.x.max - interior.x.min
  const depth = interior.floorFront - interior.z.min
  const middleZ = (interior.floorFront + interior.z.min) / 2
  const top = interior.y.max
  fixed(
    { x: width, y: WALL_HALF, z: depth },
    { x: 0, y: -WALL_HALF, z: middleZ }
  )
  fixed(
    { x: WALL_HALF, y: top, z: depth },
    { x: interior.x.min - WALL_HALF, y: top / 2, z: middleZ }
  )
  fixed(
    { x: WALL_HALF, y: top, z: depth },
    { x: interior.x.max + WALL_HALF, y: top / 2, z: middleZ }
  )
  fixed(
    { x: width, y: top, z: WALL_HALF },
    { x: 0, y: top / 2, z: interior.z.min - WALL_HALF }
  )
  fixed(
    { x: width, y: top, z: WALL_HALF },
    { x: 0, y: top / 2, z: interior.floorFront + WALL_HALF }
  )
  fixed(
    { x: width, y: WALL_HALF, z: depth },
    { x: 0, y: top + WALL_HALF, z: middleZ }
  )

  const bodies = new Map<
    number,
    { body: RAPIER.RigidBody; hull: readonly Point[] }
  >()

  const bodyOf = (handle: number) => {
    const found = bodies.get(handle)
    if (found === undefined) {
      throw new Error(`No block ${handle} in the tower's world`)
    }
    return found
  }

  const pose = (handle: number): BlockPose => {
    const { body } = bodyOf(handle)
    return { position: body.translation(), quaternion: body.rotation() }
  }

  return {
    dispose: () => world.free(),
    drop: ({ kind, u, x, y, yaw, z }) => {
      const body = world.createRigidBody(
        rapier.RigidBodyDesc.dynamic()
          .setTranslation(x, y, z)
          .setRotation(yawQuaternion(yaw))
          .setLinearDamping(0.04)
          .setAngularDamping(0.3)
          .setCcdEnabled(true)
      )
      for (const desc of colliders(rapier, kind, u)) {
        world.createCollider(
          desc.setFriction(FRICTION).setRestitution(RESTITUTION),
          body
        )
      }
      bodies.set(body.handle, { body, hull: blockHull(kind, u) })
      return body.handle
    },
    isStill: (handle) => {
      const { body } = bodyOf(handle)
      if (body.isSleeping()) {
        return true
      }
      const v = body.linvel()
      const a = body.angvel()
      return (
        Math.hypot(v.x, v.y, v.z) < TOWER_TUNING.restSpeed &&
        Math.hypot(a.x, a.y, a.z) < TOWER_TUNING.restSpeed * 20
      )
    },
    pose,
    reach: (handle) => {
      const { hull } = bodyOf(handle)
      const { position, quaternion } = pose(handle)
      let bottom = Number.POSITIVE_INFINITY
      let highest = Number.NEGATIVE_INFINITY
      for (const point of hull) {
        const y = position.y + rotate(quaternion, point).y
        bottom = Math.min(bottom, y)
        highest = Math.max(highest, y)
      }
      return { bottom, top: highest }
    },
    remove: (handle) => {
      world.removeRigidBody(bodyOf(handle).body)
      bodies.delete(handle)
    },
    step: () => world.step(),
    surfaceBelow: (point) => {
      const hit = world.castRay(
        new rapier.Ray(point, { x: 0, y: -1, z: 0 }),
        point.y,
        true
      )
      return hit === null ? 0 : point.y - hit.timeOfImpact
    }
  }
}
