import {
  AmbientLight,
  type BufferGeometry,
  CanvasTexture,
  type Color,
  CylinderGeometry,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  LineSegments,
  type Material,
  Mesh,
  MeshStandardMaterial,
  NoToneMapping,
  PerspectiveCamera,
  PlaneGeometry,
  RepeatWrapping,
  Scene,
  Shape,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer
} from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

import type { SeatId } from '@parallax/protocol/identifiers'
import { ROOM_SEAT_LIMIT, type SeatSlot } from '@parallax/protocol/room'
import type { TowerBlock } from '@parallax/protocol/tower'

import { aimAlcoveCamera } from '@/features/alcove/aim-alcove-camera'
import type { AlcoveInterior } from '@/features/alcove/alcove-bounds'
import {
  buildAlcoveShelf,
  type ShelfOption
} from '@/features/alcove/alcove-shelf'
import {
  enableSoftShadows,
  softenShadow
} from '@/features/alcove/alcove-soft-shadows'
import { buildAlcoveStage } from '@/features/alcove/alcove-stage'
import { SHIPPED_ALCOVE } from '@/features/alcove/shipped-alcove'

import { createSceneColors } from '../scene-colors'
import {
  ARCH_LEG,
  ARCH_LINTEL,
  blockExtent,
  blockProfile,
  blockSize
} from './tower-blocks'
import { floatingHeight, type TowerMatchView } from './tower-match'
import type { BlockPose } from './tower-physics'
import { TOWER_TUNING } from './tower-tuning'

/** Where a lane's pencil mark and its floating block's tag sit on the canvas, in CSS pixels. */
export type LaneAnchors = {
  readonly floating: { readonly x: number; readonly y: number } | null
  readonly height: { readonly x: number; readonly y: number }
}

/** What the renderer is handed each frame. */
export type TowerFrame = {
  readonly poseOf: (handle: number) => BlockPose
  readonly slotOf: (seat: SeatId) => SeatSlot | undefined
  readonly view: TowerMatchView
}

export type TowerRenderer = {
  dispose: () => void
  /** Draws the frame, `seconds` after the last; answers each lane's anchors for the DOM over the canvas. */
  draw: (frame: TowerFrame, seconds: number) => readonly LaneAnchors[]
}

/**
 * The child's height chart pinned on the back wall: a yellow strip ruled every
 * 2 cm, longer every 10, from the floor to 1 m 60 (one alcove unit).
 */
const chartTexture = (yellow: Color, ink: Color): CanvasTexture => {
  const width = 64
  const height = 1024
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (context !== null) {
    context.fillStyle = `#${yellow.getHexString()}`
    context.fillRect(0, 0, width, height)
    context.fillStyle = `#${ink.getHexString()}`
    for (let cm = 2; cm < TOWER_TUNING.cmPerUnit; cm += 2) {
      const y = height - (cm / TOWER_TUNING.cmPerUnit) * height
      const isTen = cm % 10 === 0
      context.fillRect(
        0,
        y - (isTen ? 2 : 1),
        width * (isTen ? 0.7 : 0.35),
        isTen ? 4 : 2
      )
    }
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

/** Beech grain, pale: the seat's paint multiplies it. */
const woodTexture = (): CanvasTexture => {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (context !== null) {
    context.fillStyle = '#f4ece0'
    context.fillRect(0, 0, size, size)
    for (let line = 0; line < 46; line += 1) {
      const y = (line / 46) * size + Math.sin(line * 7.1) * 4
      context.strokeStyle = line % 3 === 0 ? '#c9b292' : '#ddc9ac'
      context.globalAlpha = 0.25 + ((line * 37) % 10) / 40
      context.lineWidth = 0.6 + ((line * 13) % 7) / 4
      context.beginPath()
      for (let x = 0; x <= size; x += 4) {
        const wave = y + Math.sin(x * 0.02 + line) * 2.4
        if (x === 0) context.moveTo(x, wave)
        else context.lineTo(x, wave)
      }
      context.stroke()
    }
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  return texture
}

const extruded = (shape: Shape, depth: number): BufferGeometry => {
  const geometry = new ExtrudeGeometry(shape, {
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.0025,
    bevelThickness: 0.0025,
    curveSegments: 24,
    depth
  })
  geometry.translate(0, 0, -depth / 2)
  return geometry
}

const blockGeometry = (kind: TowerBlock, u: number): BufferGeometry => {
  const { d, h, w } = blockSize(kind, u)
  switch (kind) {
    case 'plank':
    case 'cube':
      return new RoundedBoxGeometry(w, h, d, 2, 0.004)
    case 'cylinder':
      return new CylinderGeometry(w / 2, w / 2, h, 36)
    case 'arch': {
      const leg = ARCH_LEG * u
      const radius = w / 2 - leg
      const spring = h / 2 - ARCH_LINTEL * u - radius
      const shape = new Shape()
      shape.moveTo(-w / 2, -h / 2)
      shape.lineTo(-w / 2 + leg, -h / 2)
      shape.lineTo(-w / 2 + leg, spring)
      shape.absarc(0, spring, radius, Math.PI, 0, true)
      shape.lineTo(w / 2 - leg, -h / 2)
      shape.lineTo(w / 2, -h / 2)
      shape.lineTo(w / 2, h / 2)
      shape.lineTo(-w / 2, h / 2)
      shape.closePath()
      return extruded(shape, d)
    }
    case 'trapezoid':
    case 'ell': {
      const [first, ...rest] = blockProfile(kind, u) ?? []
      const shape = new Shape()
      if (first !== undefined) shape.moveTo(first.x, first.y)
      for (const point of rest) shape.lineTo(point.x, point.y)
      shape.closePath()
      return extruded(shape, d)
    }
    default:
      return kind satisfies never
  }
}

const disposeTree = (root: Scene) => {
  root.traverse((node) => {
    if (node instanceof Mesh || node instanceof LineSegments) {
      node.geometry.dispose()
      const materials: Material[] = Array.isArray(node.material)
        ? node.material
        : [node.material]
      for (const material of materials) {
        material.dispose()
      }
    }
  })
}

/**
 * The tower in the alcove: the camera at the players' eye, beech blocks
 * painted in their player's colour, and an overhead light so each block's
 * shadow falls right under it: the shadow alone tells where it will land. The back wall and its height chart are the page's, behind the
 * transparent canvas.
 */
export const createTowerRenderer = (
  host: HTMLElement,
  interior: AlcoveInterior,
  { hasShelf = false }: ShelfOption = {}
): TowerRenderer => {
  const colors = createSceneColors(host)
  const renderer = new WebGLRenderer({ alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = NoToneMapping
  enableSoftShadows(renderer)
  renderer.domElement.classList.add('scene-canvas')
  host.prepend(renderer.domElement)

  const scene = new Scene()
  const shadowTint = colors.read('var(--wall-shadow, oklch(33.5% 0.02 159.5))')
  const ink = colors.read('var(--graphite, oklch(28.7% 0.007 118.3))')
  scene.add(
    buildAlcoveStage(SHIPPED_ALCOVE, {
      color: shadowTint,
      floorOpacity: 0.5,
      wallOpacity: 0.22
    }),
    new HemisphereLight('#ffffff', '#6b6157', 1.2),
    new AmbientLight('#ffffff', 0.15)
  )
  // From the players' side, above and to the left: each block's shadow runs
  // back along the floor and climbs the back wall. Seen almost level, the gap
  // between the tower and its shadow on the wall is what tells its depth, and
  // the shadow leaving its foot is what stands it on the floor.
  const key = new DirectionalLight('#ffffff', 1.3)
  key.position.set(-0.9, 2.2, 2.4)
  key.target.position.set(0, 0.3, -SHIPPED_ALCOVE.depth)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.bias = -0.0006
  key.shadow.normalBias = 0.002
  Object.assign(key.shadow.camera, {
    bottom: -1.3,
    far: 6,
    left: -1,
    near: 1,
    right: 1,
    top: 1.3
  })
  softenShadow(key)
  scene.add(key.target)
  // Straight down, so every block's shadow lands right under it: the aim reads off the shadow.
  const overhead = new DirectionalLight('#ffffff', 0.7)
  overhead.position.set(0.05, 6, -SHIPPED_ALCOVE.depth / 2 + 0.25)
  overhead.target.position.set(0, 0, -SHIPPED_ALCOVE.depth / 2)
  overhead.castShadow = true
  overhead.shadow.mapSize.set(2048, 2048)
  overhead.shadow.bias = -0.0008
  Object.assign(overhead.shadow.camera, {
    bottom: -0.7,
    far: 7,
    left: -0.7,
    near: 3,
    right: 0.7,
    top: 0.7
  })
  softenShadow(overhead)
  scene.add(key, overhead, overhead.target)
  if (hasShelf) {
    scene.add(
      buildAlcoveShelf(SHIPPED_ALCOVE, {
        metal: colors.read('var(--host-line)'),
        wood: colors.read('var(--host-panel-frame)')
      })
    )
  }

  const chartWidth = 0.09
  const chart = new Mesh(
    new PlaneGeometry(chartWidth, 1),
    new MeshStandardMaterial({
      map: chartTexture(
        colors.read('var(--chart-yellow, oklch(83.2% 0.159 88.6))'),
        ink
      ),
      roughness: 0.8
    })
  )
  chart.position.set(
    interior.x.min + chartWidth / 2 + 0.02,
    0.5,
    interior.z.min + 0.001
  )
  chart.receiveShadow = true
  scene.add(chart)

  const grain = woodTexture()
  const unpainted = new MeshStandardMaterial({
    color: colors.read('var(--beech, oklch(72.1% 0.081 69.7))'),
    map: grain,
    roughness: 0.6
  })
  const paints = Array.from(
    { length: ROOM_SEAT_LIMIT },
    (_, slot) =>
      new MeshStandardMaterial({
        color: colors.readSeat(slot),
        map: grain,
        roughness: 0.48
      })
  )
  const paintOf = (slot: SeatSlot | undefined) =>
    slot === undefined ? unpainted : (paints[slot] ?? unpainted)

  const geometries = new Map<string, BufferGeometry>()
  const geometryOf = (kind: TowerBlock, u: number) => {
    const key = `${kind}-${u}`
    let geometry = geometries.get(key)
    if (geometry === undefined) {
      geometry = blockGeometry(kind, u)
      geometries.set(key, geometry)
    }
    return geometry
  }

  const meshOf = (kind: TowerBlock, u: number, slot: SeatSlot | undefined) => {
    const mesh = new Mesh(geometryOf(kind, u), paintOf(slot))
    mesh.castShadow = true
    mesh.receiveShadow = true
    return mesh
  }

  const placed = new Map<number, Mesh>()
  const floating = new Group()
  scene.add(floating)

  const camera = new PerspectiveCamera()
  const canvas = { height: 0, width: 0 }
  const fitToHost = () => {
    const { clientHeight: height, clientWidth: width } = host
    if (width === 0 || height === 0) return
    canvas.height = height
    canvas.width = width
    renderer.setSize(width, height, false)
    aimAlcoveCamera(camera, SHIPPED_ALCOVE, canvas)
  }
  const resizing = new ResizeObserver(fitToHost)
  resizing.observe(host)
  fitToHost()

  const projected = new Vector3()
  const toCanvas = (x: number, y: number, z: number) => {
    projected.set(x, y, z).project(camera)
    return {
      x: ((projected.x + 1) / 2) * canvas.width,
      y: ((1 - projected.y) / 2) * canvas.height
    }
  }

  let clock = 0

  return {
    dispose: () => {
      resizing.disconnect()
      for (const geometry of geometries.values()) {
        geometry.dispose()
      }
      for (const mesh of [...placed.values(), ...floating.children]) {
        mesh.removeFromParent()
      }
      disposeTree(scene)
      grain.dispose()
      renderer.dispose()
      renderer.domElement.remove()
      colors.dispose()
    },
    draw: ({ poseOf, slotOf, view }, seconds) => {
      clock += seconds
      const seen = new Set<number>()
      for (const lane of view.lanes) {
        for (const block of lane.blocks) {
          seen.add(block.handle)
          let mesh = placed.get(block.handle)
          if (mesh === undefined) {
            mesh = meshOf(block.kind, block.u, slotOf(block.seat))
            placed.set(block.handle, mesh)
            scene.add(mesh)
          }
          const { position, quaternion } = poseOf(block.handle)
          mesh.position.set(position.x, position.y, position.z)
          mesh.quaternion.set(
            quaternion.x,
            quaternion.y,
            quaternion.z,
            quaternion.w
          )
        }
      }
      for (const [handle, mesh] of placed) {
        if (!seen.has(handle)) {
          mesh.removeFromParent()
          placed.delete(handle)
        }
      }

      floating.clear()
      const bob = Math.sin(clock * 2.4) * TOWER_TUNING.bob

      const anchors = view.lanes.map((lane): LaneAnchors => {
        const height = toCanvas(
          lane.centre.x + lane.halfWidth * 0.55,
          lane.height,
          lane.centre.z
        )
        if (lane.floating === null) {
          return { floating: null, height }
        }
        const { kind, seat, x, yaw, z } = lane.floating
        const y = floatingHeight(lane, interior) + bob
        const mesh = meshOf(kind, lane.u, slotOf(seat))
        mesh.position.set(x, y, z)
        mesh.rotation.set(0, yaw, 0)
        floating.add(mesh)

        const extent = blockExtent(kind, lane.u, yaw)

        return { floating: toCanvas(x, y + extent.above + 0.02, z), height }
      })
      renderer.render(scene, camera)
      return anchors
    }
  }
}
