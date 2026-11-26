import {
  BoxGeometry,
  type BufferGeometry,
  CapsuleGeometry,
  CatmullRomCurve3,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  type Material,
  Mesh,
  MeshPhysicalMaterial,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3
} from 'three'

import type { PlushKind } from './claw-match'
import { CHUTE_SIZE, CHUTE_WALL, PLUSH_RADIUS } from './claw-pit'

/** A capsule's shell radius. */
export const CAPSULE_RADIUS = 0.06

const sphere = new SphereGeometry(1, 24, 16)
const ear = new CapsuleGeometry(0.28, 0.9, 6, 12)
const beak = new ConeGeometry(0.4, 0.9, 12)
const dome = new SphereGeometry(
  CAPSULE_RADIUS,
  24,
  12,
  0,
  Math.PI * 2,
  0,
  Math.PI / 2
)
const bowl = new SphereGeometry(
  CAPSULE_RADIUS,
  24,
  12,
  0,
  Math.PI * 2,
  Math.PI / 2,
  Math.PI / 2
)

/** The geometries every prize shares: freed once, with the renderer. */
export const disposeSharedGeometries = (): void => {
  for (const geometry of [sphere, ear, beak, dome, bowl]) geometry.dispose()
}

/** Fur: rough, with a pale sheen at grazing angles. */
export const furMaterial = (color: Color): MeshPhysicalMaterial =>
  new MeshPhysicalMaterial({
    color,
    roughness: 0.95,
    sheen: 1,
    sheenColor: color.clone().lerp(new Color(1, 1, 1), 0.45),
    sheenRoughness: 0.55
  })

type Vec = readonly [number, number, number]

const part = (
  geometry: BufferGeometry,
  material: Material,
  scale: Vec,
  position: Vec
): Mesh => {
  const mesh = new Mesh(geometry, material)
  mesh.scale.set(...scale)
  mesh.position.set(...position)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

/** One plush, centred on its body: a bear, a bunny, a duck or an octopus. */
export const buildPlush = (
  kind: PlushKind,
  materials: { eye: Material; fur: Material; muzzle: Material }
): Group => {
  const { eye, fur, muzzle } = materials
  const r = PLUSH_RADIUS
  const group = new Group()
  const eyes = (y: number, z: number, spread: number, size = 0.07) => [
    part(
      sphere,
      eye,
      [r * size, r * size, r * 0.05],
      [-r * spread, r * y, r * z]
    ),
    part(
      sphere,
      eye,
      [r * size, r * size, r * 0.05],
      [r * spread, r * y, r * z]
    )
  ]
  switch (kind) {
    case 'bear':
      group.add(
        part(sphere, fur, [r, r * 0.92, r * 0.85], [0, 0, 0]),
        part(
          sphere,
          fur,
          [r * 0.72, r * 0.68, r * 0.66],
          [0, r * 1.15, r * 0.12]
        ),
        part(
          sphere,
          fur,
          [r * 0.24, r * 0.24, r * 0.16],
          [-r * 0.5, r * 1.68, r * 0.05]
        ),
        part(
          sphere,
          fur,
          [r * 0.24, r * 0.24, r * 0.16],
          [r * 0.5, r * 1.68, r * 0.05]
        ),
        part(
          sphere,
          muzzle,
          [r * 0.3, r * 0.22, r * 0.2],
          [0, r * 1.02, r * 0.68]
        ),
        ...eyes(1.26, 0.66, 0.24)
      )
      break
    case 'bunny': {
      const left = part(
        ear,
        fur,
        [r * 0.5, r * 0.85, r * 0.3],
        [-r * 0.28, r * 1.85, 0]
      )
      left.rotation.z = 0.22
      const right = part(
        ear,
        fur,
        [r * 0.5, r * 0.85, r * 0.3],
        [r * 0.28, r * 1.85, 0]
      )
      right.rotation.z = -0.22
      group.add(
        part(sphere, fur, [r * 0.95, r * 0.9, r * 0.85], [0, 0, 0]),
        part(
          sphere,
          fur,
          [r * 0.66, r * 0.62, r * 0.62],
          [0, r * 1.05, r * 0.1]
        ),
        left,
        right,
        part(
          sphere,
          muzzle,
          [r * 0.22, r * 0.16, r * 0.14],
          [0, r * 0.94, r * 0.66]
        ),
        ...eyes(1.16, 0.62, 0.22)
      )
      break
    }
    case 'duck': {
      const bill = part(
        beak,
        muzzle,
        [r * 0.42, r * 0.34, r * 0.24],
        [0, r * 0.88, r * 0.92]
      )
      bill.rotation.x = Math.PI / 2
      group.add(
        part(sphere, fur, [r * 1.05, r * 0.82, r * 0.9], [0, 0, 0]),
        part(sphere, fur, [r * 0.6, r * 0.6, r * 0.6], [0, r * 0.95, r * 0.3]),
        bill,
        ...eyes(1.08, 0.78, 0.24)
      )
      break
    }
    case 'octopus': {
      group.add(part(sphere, fur, [r, r * 0.95, r], [0, r * 0.25, 0]))
      for (let leg = 0; leg < 5; leg += 1) {
        const angle = (leg / 5) * Math.PI * 2 + 0.3
        group.add(
          part(
            sphere,
            fur,
            [r * 0.24, r * 0.2, r * 0.24],
            [Math.cos(angle) * r * 0.75, -r * 0.62, Math.sin(angle) * r * 0.75]
          )
        )
      }
      group.add(...eyes(0.42, 0.9, 0.28, 0.08))
      break
    }
    default:
      return kind satisfies never
  }
  return group
}

/** A capsule: a clear dome over a candy-coloured bowl. */
export const buildCapsule = (materials: {
  clear: Material
  shell: Material
}): Group => {
  const group = new Group()
  const top = new Mesh(dome, materials.clear)
  const bottom = new Mesh(bowl, materials.shell)
  top.castShadow = true
  bottom.castShadow = true
  bottom.receiveShadow = true
  group.add(top, bottom)
  return group
}

export type ClawModel = {
  /** The cable from the claw's crown up to its carriage. */
  readonly cable: Mesh
  readonly group: Group
  /** Opens the prongs: 0 shut, 1 wide. */
  setOpen: (amount: number) => void
  /** Hangs the cable from `top` down to `bottom` at the claw's axis. */
  setCable: (x: number, z: number, bottom: number, top: number) => void
}

const prongCurve = new CatmullRomCurve3([
  new Vector3(0, 0, 0),
  new Vector3(0, -0.04, 0.05),
  new Vector3(0, -0.11, 0.075),
  new Vector3(0, -0.17, 0.045),
  new Vector3(0, -0.19, 0.012)
])

/** Above the claw's hub, where its cable leaves the crown. */
export const CLAW_CROWN = 0.065

/** A chrome claw: its hub lacquered in the seat's colour, three prongs, its cable. */
export const buildClaw = (materials: {
  cable: Material
  lacquer: Material
  metal: Material
  ring: Material
}): ClawModel => {
  const { cable: cableMaterial, lacquer, metal, ring } = materials
  const group = new Group()
  const hub = new Mesh(new CylinderGeometry(0.058, 0.05, 0.075, 28), lacquer)
  hub.castShadow = true
  const band = new Mesh(new CylinderGeometry(0.0585, 0.0585, 0.014, 28), ring)
  band.position.y = 0.012
  const collar = new Mesh(new TorusGeometry(0.056, 0.008, 8, 32), metal)
  collar.rotation.x = Math.PI / 2
  collar.position.y = -0.035
  const crown = new Mesh(new CylinderGeometry(0.018, 0.03, 0.03, 16), metal)
  crown.position.y = 0.05
  group.add(hub, band, collar, crown)

  const prongGeometry = new TubeGeometry(prongCurve, 24, 0.009, 8, false)
  const hinges: Group[] = []
  for (let prong = 0; prong < 3; prong += 1) {
    const pivot = new Group()
    pivot.rotation.y = (prong / 3) * Math.PI * 2 + Math.PI / 3
    const hinge = new Group()
    hinge.position.set(0, -0.035, 0.035)
    const mesh = new Mesh(prongGeometry, metal)
    mesh.castShadow = true
    hinge.add(mesh)
    pivot.add(hinge)
    group.add(pivot)
    hinges.push(hinge)
  }

  const cable = new Mesh(
    new CylinderGeometry(0.005, 0.005, 1, 8),
    cableMaterial
  )
  cable.castShadow = true
  return {
    cable,
    group,
    setCable: (x, z, bottom, top) => {
      cable.scale.y = Math.max(0.01, top - bottom)
      cable.position.set(x, (top + bottom) / 2, z)
    },
    setOpen: (amount) => {
      for (const hinge of hinges) hinge.rotation.x = -0.25 + amount * 0.75
    }
  }
}

/** A prize chute: an open box at the front of the floor, its lip towards the players. */
export const buildChute = (
  x: number,
  z: number,
  materials: { lip: Material; paint: Material }
): Group => {
  const { depth, height, width } = CHUTE_SIZE
  const wall = CHUTE_WALL
  const lipDepth = 0.02
  const parts: [number, number, number, number, number, number, Material][] = [
    [width, height, wall, x, height / 2, z + depth / 2, materials.paint],
    [width, height, wall, x, height / 2, z - depth / 2, materials.paint],
    [wall, height, depth, x - width / 2, height / 2, z, materials.paint],
    [wall, height, depth, x + width / 2, height / 2, z, materials.paint],
    [
      width + wall,
      0.016,
      lipDepth,
      x,
      height,
      z + depth / 2 + wall / 2 - lipDepth / 2,
      materials.lip
    ]
  ]
  const group = new Group()
  for (const [w, h, d, px, py, pz, material] of parts) {
    const mesh = new Mesh(new BoxGeometry(w, h, d), material)
    mesh.position.set(px, py, pz)
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
  }
  return group
}
