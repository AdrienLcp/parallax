import {
  type Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  RingGeometry,
  SphereGeometry,
  TetrahedronGeometry
} from 'three'

import { laidFlat } from './laid-flat'

/** How long a burst lasts on the floor, in seconds. */
export const BURST_SECONDS = 1.2
const SHARD_COUNT = 28
const PUFF_COUNT = 7
/** The gravity the shards fly under, in arena units per second squared. */
const GRAVITY = 9
/** How far from the impact each part reaches at most, in arena units, before the room limits it: shards, the shock ring, the dust. */
const SPREAD = { dust: 0.8, ring: 0.74, shards: 0.31 } as const

type Shard = {
  readonly mesh: Mesh
  readonly spin: number
  readonly vx: number
  readonly vy: number
  readonly vz: number
}

type Puff = {
  readonly dx: number
  readonly dy: number
  readonly dz: number
  readonly mesh: Mesh
}

export type Burst = {
  readonly group: Group
  /**
   * Shows the burst `elapsed` seconds after impact, its centre in the group's
   * parent; `room` caps how far shards and dust spread from it, so none
   * crosses a wall. Hides it once over.
   */
  readonly show: (input: {
    elapsed: number
    room: number
    x: number
    z: number
  }) => void
  readonly hide: () => void
}

/**
 * A top that hits the floor: shards of its lacquer, cap and mark fly and
 * settle, a puff of dust swells and thins, a shock ring spreads on the floor.
 * In arena units, the floor at y 0.
 */
export const buildBurst = ({
  cap,
  dust,
  ink,
  lacquer,
  mark
}: {
  cap: Color
  dust: Color
  ink: Color
  lacquer: Color
  mark: Color
}): Burst => {
  const group = new Group()
  group.visible = false
  const palette = [lacquer, lacquer, cap, mark]
  const shardGeometry = new TetrahedronGeometry(0.04)
  const shardMaterials = palette.map(
    (color) => new MeshStandardMaterial({ color, roughness: 0.4 })
  )
  const shards: Shard[] = Array.from({ length: SHARD_COUNT }, (_, index) => {
    const mesh = new Mesh(
      shardGeometry,
      shardMaterials[index % shardMaterials.length]
    )
    mesh.castShadow = true
    const angle =
      (index / SHARD_COUNT) * Math.PI * 2 + Math.sin(index * 12.9898) * 0.4
    const out = 0.45 + ((index * 7) % 5) * 0.12
    group.add(mesh)
    return {
      mesh,
      spin: 6 + (index % 5) * 3,
      vx: Math.cos(angle) * out,
      vy: 1.2 + ((index * 3) % 4) * 0.45,
      vz: Math.sin(angle) * out
    }
  })

  const puffMaterial = new MeshStandardMaterial({
    color: dust,
    depthWrite: false,
    roughness: 1,
    transparent: true
  })
  const puffGeometry = new SphereGeometry(0.09, 16, 12)
  const puffs: Puff[] = Array.from({ length: PUFF_COUNT }, (_, index) => {
    const mesh = new Mesh(puffGeometry, puffMaterial)
    const angle = (index / PUFF_COUNT) * Math.PI * 2
    group.add(mesh)
    return {
      dx: Math.cos(angle) * 0.16,
      dy: 0.04 + (index % 3) * 0.04,
      dz: Math.sin(angle) * 0.16,
      mesh
    }
  })

  const ringMaterial = new MeshBasicMaterial({
    color: ink,
    depthWrite: false,
    transparent: true
  })
  const ring = laidFlat(
    new Mesh(new RingGeometry(0.82, 1, 64), ringMaterial),
    0
  )
  group.add(ring)

  const hide = () => {
    group.visible = false
  }

  const show: Burst['show'] = ({ elapsed, room, x, z }) => {
    if (elapsed < 0 || elapsed >= BURST_SECONDS) {
      hide()
      return
    }
    group.visible = true
    const reachOf = (spread: number) => Math.min(1, Math.max(room, 0) / spread)
    const drift = ((1 - Math.exp(-3 * elapsed)) / 3) * reachOf(SPREAD.shards)
    const fade = 1 - (elapsed / BURST_SECONDS) ** 3
    for (const { mesh, spin, vx, vy, vz } of shards) {
      mesh.position.set(
        x + vx * drift,
        Math.max(0.02, 0.06 + vy * elapsed - 0.5 * GRAVITY * elapsed ** 2),
        z + vz * drift
      )
      mesh.rotation.set(spin * elapsed, spin * elapsed * 0.7, 0)
      mesh.scale.setScalar(Math.max(fade, 0.001))
    }
    const grow = (0.4 + elapsed * 2.4) * reachOf(SPREAD.dust)
    for (const { dx, dy, dz, mesh } of puffs) {
      mesh.position.set(x + dx * grow, dy + elapsed * 0.25, z + dz * grow)
      mesh.scale.setScalar(Math.max(grow, 0.001))
    }
    puffMaterial.opacity =
      0.6 * Math.max(1 - elapsed / (BURST_SECONDS * 0.8), 0)
    ring.position.set(x, 0.003, z)
    ring.scale.setScalar(
      (0.1 + Math.min(elapsed, 0.4) * 1.6) * reachOf(SPREAD.ring)
    )
    ringMaterial.opacity = 0.35 * Math.max(1 - elapsed / 0.4, 0)
  }

  return { group, hide, show }
}
