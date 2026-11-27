import {
  AmbientLight,
  CircleGeometry,
  Color,
  DirectionalLight,
  Group,
  LatheGeometry,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NoToneMapping,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShadowMaterial,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
  Vector3,
  WebGLRenderer
} from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

import { ROOM_SEAT_LIMIT, type SeatSlot } from '@parallax/protocol/room'

import { aimAlcoveCamera } from '@/features/alcove/aim-alcove-camera'
import { alcoveInterior } from '@/features/alcove/alcove-bounds'
import { buildAlcoveShelf } from '@/features/alcove/alcove-shelf'
import {
  enableSoftShadows,
  softenShadow
} from '@/features/alcove/alcove-soft-shadows'
import { buildAlcoveStage } from '@/features/alcove/alcove-stage'
import { SHIPPED_ALCOVE } from '@/features/alcove/shipped-alcove'
import { prefersReducedMotion } from '@/infrastructure/browser'

import { aimArenaCamera } from './aim-arena-camera'
import { type ArenaFraming, frameTheTable, TOP_HEIGHT } from './arena-camera'
import type { ArenaFrame, DrawnTop } from './arena-frame'
import { ARENA_IN_ALCOVE } from './arena-in-alcove'
import type {
  ArenaView,
  CreateArenaRenderer,
  TagAnchor
} from './arena-renderer'
import { type ArenaHeights, heightsOf } from './arena-shape'
import { ARENA_TABLE } from './arena-table'
import { buildBurst } from './burst-model'
import { buildColumn } from './column-model'
import { laidFlat } from './laid-flat'
import { SUMO_TUNING } from './sumo-tuning'
import { buildTable } from './table-model'
import { type TopPose, topPoseOf } from './top-pose'
import { TOP_PROFILE } from './top-profile'

const TOP_RADIUS = SUMO_TUNING.topRadius
/** About a turn every two seconds: alive, and the carved glyph stays readable. */
const SPIN_RADIANS_PER_SECOND = 3
/** Where the key light stands and how far its shadow box reaches, in the scene's units, for each view. */
const KEY_LIGHT_BY_VIEW: Record<
  ArenaView,
  { bias: number; distance: number; reach: number }
> = {
  /** The arena is under an alcove unit across: a tighter box keeps its shadows sharp, the back wall included. */
  alcove: { bias: -0.0002, distance: 3, reach: 1.1 },
  framed: { bias: -0.0004, distance: 5, reach: 1.7 }
}
/** How far the framed view's floor reaches around the column, in arena units: past every edge the lens shows. */
const FRAMED_FLOOR_SIDE = 9
const FLOOR_CATCHER_LIFT = 0.0006

/** The flat seat top's box (100 × 100): its lacquer and cap radii, and the glyph's scale in the cap. */
const FLAT_TOP = {
  boxCentre: 50,
  capRadius: 30,
  glyphScale: 0.36,
  lacquerRadius: 46
} as const

const circlePoints = (radius: number): [number, number][] =>
  Array.from({ length: 48 }, (_, step) => {
    const angle = (step * 2 * Math.PI) / 48
    return [
      FLAT_TOP.boxCentre + Math.cos(angle) * radius,
      FLAT_TOP.boxCentre + Math.sin(angle) * radius
    ]
  })

/** Each slot's carved glyph, in the flat seat top's box: circle, triangle, square, diamond, cross, hexagon. */
const GLYPH_OUTLINES: readonly (readonly [number, number][])[] = [
  circlePoints(41),
  [
    [50, 8],
    [95, 86],
    [5, 86]
  ],
  [
    [14, 14],
    [86, 14],
    [86, 86],
    [14, 86]
  ],
  [
    [50, 4],
    [92, 50],
    [50, 96],
    [8, 50]
  ],
  [
    [37, 6],
    [63, 6],
    [63, 37],
    [94, 37],
    [94, 63],
    [63, 63],
    [63, 94],
    [37, 94],
    [37, 63],
    [6, 63],
    [6, 37],
    [37, 37]
  ],
  [
    [50, 6],
    [90, 28],
    [90, 72],
    [50, 94],
    [10, 72],
    [10, 28]
  ]
]

const glyphShape = (slot: SeatSlot): Shape =>
  new Shape().setFromPoints(
    (GLYPH_OUTLINES[slot] ?? []).map(
      ([x, y]) => new Vector2(x - FLAT_TOP.boxCentre, FLAT_TOP.boxCentre - y)
    )
  )

type SeatColors = { cap: Color; lacquer: Color; mark: Color }

/** Resolves any CSS colour the page knows, tokens and `color-mix` included, to sRGB. */
const createColorReader = (host: HTMLElement) => {
  const probe = document.createElement('span')
  probe.hidden = true
  host.append(probe)
  const pixel = document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true })

  const read = (cssColor: string): Color => {
    probe.style.color = cssColor
    const resolved = getComputedStyle(probe).color
    if (pixel === null) return new Color(resolved)
    pixel.clearRect(0, 0, 1, 1)
    pixel.fillStyle = resolved
    pixel.fillRect(0, 0, 1, 1)
    const [red = 0, green = 0, blue = 0] = pixel.getImageData(0, 0, 1, 1).data
    return new Color().setRGB(
      red / 255,
      green / 255,
      blue / 255,
      SRGBColorSpace
    )
  }

  const readSeat = (slot: SeatSlot): SeatColors => {
    probe.dataset.seatSlot = String(slot)
    const style = getComputedStyle(probe)
    const colors = {
      cap: read(style.getPropertyValue('--seat-cap')),
      lacquer: read(style.getPropertyValue('--seat')),
      mark: read(style.getPropertyValue('--seat-mark'))
    }
    delete probe.dataset.seatSlot
    return colors
  }

  return { dispose: () => probe.remove(), read, readSeat }
}

/** A spinning top standing on its point, at the shipped height: lacquered body, brass ring, cap and carved glyph. */
const buildTop = ({
  colors,
  ring,
  slot
}: {
  colors: SeatColors
  ring: Color
  slot: SeatSlot
}): Group => {
  const profile = TOP_PROFILE.map(
    ([x, y]) => new Vector2(x * TOP_RADIUS, y * TOP_HEIGHT)
  )

  const body = new Mesh(
    new LatheGeometry(profile, 64),
    new MeshPhysicalMaterial({
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      color: colors.lacquer,
      roughness: 0.38
    })
  )
  body.castShadow = true

  const brassRing = new Mesh(
    new TorusGeometry(TOP_RADIUS * 0.985, TOP_RADIUS * 0.045, 12, 64),
    new MeshStandardMaterial({ color: ring, metalness: 0.85, roughness: 0.3 })
  )
  brassRing.rotation.x = Math.PI / 2
  brassRing.position.y = 0.8 * TOP_HEIGHT
  brassRing.castShadow = true

  const unit = TOP_RADIUS / FLAT_TOP.lacquerRadius
  const cap = laidFlat(
    new Mesh(
      new CircleGeometry(FLAT_TOP.capRadius * unit, 48),
      new MeshStandardMaterial({ color: colors.cap, roughness: 0.55 })
    ),
    TOP_HEIGHT + 0.0005
  )
  const glyph = laidFlat(
    new Mesh(
      new ShapeGeometry(glyphShape(slot)),
      new MeshStandardMaterial({ color: colors.mark, roughness: 0.7 })
    ),
    TOP_HEIGHT + 0.001
  )
  glyph.scale.setScalar(FLAT_TOP.glyphScale * unit)

  const spinning = new Group()
  spinning.add(body, brassRing, cap, glyph)
  const top = new Group()
  top.add(spinning)
  top.visible = false
  return top
}

/** Stands a top where its pose puts it, stretched along its axis to the tuned height. */
const placeTop = ({
  drawn,
  heights,
  spinAngle,
  top
}: {
  drawn: DrawnTop
  heights: ArenaHeights
  spinAngle: number
  top: Group
}): TopPose => {
  const pose = topPoseOf(drawn, heights)
  top.visible = true
  top.position.set(pose.x, pose.y, pose.z)
  top.rotation.set(0, -pose.heading, 0)
  const spinning = top.children[0]
  if (spinning !== undefined) {
    spinning.scale.set(1, heights.topHeight / TOP_HEIGHT, 1)
    spinning.rotation.set(0, 0, -pose.lean)
    spinning.rotateY(spinAngle + pose.heading)
  }
  return pose
}

/** Projects the far edge of a top's crown (the top of it, as the camera at `azimuth` sees it) onto the canvas, in CSS pixels. */
const tagAnchorOf = ({
  azimuth,
  camera,
  canvas,
  slot,
  stand,
  top,
  topHeight
}: {
  azimuth: number
  camera: PerspectiveCamera
  canvas: { height: number; width: number }
  slot: SeatSlot
  /** The group the table and the tops stand in. */
  stand: Group
  top: Group
  topHeight: number
}): TagAnchor => {
  const crown = stand
    .localToWorld(
      new Vector3(
        top.position.x - Math.sin(azimuth) * TOP_RADIUS,
        top.position.y + topHeight,
        top.position.z - Math.cos(azimuth) * TOP_RADIUS
      )
    )
    .project(camera)
  return {
    slot,
    x: ((crown.x + 1) / 2) * canvas.width,
    y: ((1 - crown.y) / 2) * canvas.height
  }
}

const disposeTree = (root: Scene): void => {
  root.traverse((node) => {
    if (node instanceof Mesh) {
      node.geometry.dispose()
      const materials = Array.isArray(node.material)
        ? node.material
        : [node.material]
      for (const material of materials) material.dispose()
    }
  })
}

/** The key light, high and to the left of the room, aimed at the arena's middle (`target`, in the scene), its shadows crisp at the column's foot and softer under a jumping top. */
const buildKeyLight = (
  color: Color,
  target: Vector3,
  view: ArenaView
): DirectionalLight => {
  const { bias, distance, reach } = KEY_LIGHT_BY_VIEW[view]
  const key = new DirectionalLight(color)
  key.target.position.copy(target)
  key.position
    .set(-0.7, 3, 1.1)
    .normalize()
    .multiplyScalar(distance)
    .add(target)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.bias = bias
  Object.assign(key.shadow.camera, {
    bottom: -reach,
    far: distance * 2.4,
    left: -reach,
    near: 0.5,
    right: reach,
    top: reach
  })
  softenShadow(key)
  return key
}

/** The floor of the framed view: never drawn, it only catches the table's, the column's and the tops' shadows. */
const buildFramedFloor = (ink: Color): Mesh => {
  const floor = laidFlat(
    new Mesh(
      new PlaneGeometry(FRAMED_FLOOR_SIDE, FRAMED_FLOOR_SIDE),
      new ShadowMaterial({ color: ink, depthWrite: false })
    ),
    FLOOR_CATCHER_LIFT
  )
  floor.receiveShadow = true
  floor.renderOrder = 5
  return floor
}

/**
 * The default renderer: one flat portrait frame, for the HLD and any ordinary
 * screen. The arena is a walnut table on a column standing on the alcove's
 * floor; lacquered tops spin and hop on its felt, fall off its edge and burst
 * on the floor, over soft grounded shadows. In the `alcove` view the players' eye sees it in the measured box
 * and the orbit turns the table; in the `framed` one a perspective camera a
 * little above it frames it and orbits it. The canvas stays transparent
 * around the table: the page's solid backdrop is the alcove's.
 */
export const createFlatPortraitRenderer: CreateArenaRenderer = (
  host,
  initialTuning,
  view
) => {
  const colors = createColorReader(host)
  const renderer = new WebGLRenderer({ alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = NoToneMapping
  enableSoftShadows(renderer)
  renderer.domElement.classList.add('arena-canvas')
  host.append(renderer.domElement)

  const scene = new Scene()
  const environment = new PMREMGenerator(renderer)
  const reflections = environment.fromScene(new RoomEnvironment(), 0.04)
  scene.environment = reflections.texture
  scene.environmentIntensity = 0.55

  const ivory = colors.read('var(--ivory)')
  const ring = colors.read('var(--seat-top-ring)')
  const tops = Array.from({ length: ROOM_SEAT_LIMIT }, (_, slot) =>
    buildTop({ colors: colors.readSeat(slot), ring, slot })
  )
  const ink = colors.read('var(--lacquer-ink)')
  const table = buildTable(colors.read)
  table.position.y = ARENA_TABLE.rise
  const column = buildColumn(
    colors.read('color-mix(in oklab, var(--lacquer-ink) 78%, var(--chalk))'),
    ARENA_TABLE.rise
  )
  const dust = colors.read(
    'color-mix(in oklab, var(--ivory) 85%, var(--lacquer-ink))'
  )
  const bursts = Array.from({ length: ROOM_SEAT_LIMIT }, (_, slot) =>
    buildBurst({ ...colors.readSeat(slot), dust, ink })
  )
  /** The group the column, the table, the tops and their bursts stand in, in arena units, the floor at y 0. */
  const stand = new Group()
  stand.add(column, table, ...tops, ...bursts.map((burst) => burst.group))
  if (view === 'alcove') {
    stand.scale.setScalar(ARENA_IN_ALCOVE.scale)
    stand.position.z = ARENA_IN_ALCOVE.z
    scene.add(
      buildAlcoveStage(SHIPPED_ALCOVE, {
        color: ink,
        floorOpacity: initialTuning.lighting.shadowOpacity,
        wallOpacity: initialTuning.lighting.shadowOpacity
      }),
      buildAlcoveShelf(SHIPPED_ALCOVE, {
        metal: colors.read('var(--host-line)'),
        wood: colors.read('var(--host-panel-frame)')
      })
    )
  } else {
    stand.add(buildFramedFloor(ink))
  }
  stand.updateMatrixWorld(true)
  /** Halfway up the column to the felt, so the key light's box holds the table, the column and their shadows on the floor. */
  const keyLight = buildKeyLight(
    ivory,
    stand.localToWorld(
      new Vector3(0, (ARENA_TABLE.rise + ARENA_TABLE.thickness) / 2, 0)
    ),
    view
  )

  /** How far a burst at `x`, `z` on the stand's floor may spread, in arena units, before it crosses an edge of the alcove's interior. */
  const interior = alcoveInterior(SHIPPED_ALCOVE)
  const roomAround = (x: number, z: number): number => {
    if (view !== 'alcove') return Number.POSITIVE_INFINITY
    const at = stand.localToWorld(new Vector3(x, 0, z))
    return (
      Math.min(
        at.x - interior.x.min,
        interior.x.max - at.x,
        at.z - interior.z.min,
        interior.floorFront - at.z
      ) / ARENA_IN_ALCOVE.scale
    )
  }

  scene.add(stand, new AmbientLight(ivory, 0.6), keyLight, keyLight.target)
  const shadows: ShadowMaterial[] = []
  scene.traverse((node) => {
    if (node instanceof Mesh && node.material instanceof ShadowMaterial) {
      shadows.push(node.material)
    }
  })

  const camera = new PerspectiveCamera(45, 1, 0.1, 60)

  const canvas = { height: 0, width: 0 }
  let tuning = initialTuning
  let heights = heightsOf(tuning.shape)
  let framing: ArenaFraming | null = null

  const frame = () => {
    if (canvas.width === 0 || canvas.height === 0) return
    if (view === 'alcove') {
      aimAlcoveCamera(camera, SHIPPED_ALCOVE, canvas)
      return
    }
    framing = frameTheTable(canvas, tuning.lens, tuning.shape)
    aimArenaCamera(camera, framing)
  }

  const fitToHost = () => {
    const { clientHeight: height, clientWidth: width } = host
    if (width === 0 || height === 0) return
    canvas.height = height
    canvas.width = width
    renderer.setSize(width, height, false)
    frame()
  }

  const applyTuning = () => {
    heights = heightsOf(tuning.shape)
    table.scale.y = tuning.shape.drumHeightScale
    keyLight.intensity = tuning.lighting.keyLightIntensity
    for (const shadow of shadows) {
      shadow.opacity = tuning.lighting.shadowOpacity
    }
    frame()
  }
  applyTuning()
  const resizing = new ResizeObserver(fitToHost)
  resizing.observe(host)
  fitToHost()

  const spinRate = prefersReducedMotion() ? 0 : SPIN_RADIANS_PER_SECOND
  const spinAngles = tops.map(() => 0)
  let clock = 0
  /** Where and when each slot's top hit the floor, while its burst plays and until it stands again. */
  const impacts: ({ at: number; room: number; x: number; z: number } | null)[] =
    tops.map(() => null)

  return {
    dispose: () => {
      resizing.disconnect()
      disposeTree(scene)
      reflections.dispose()
      environment.dispose()
      renderer.dispose()
      renderer.domElement.remove()
      colors.dispose()
    },
    draw: (arena: ArenaFrame, seconds: number, azimuth: number) => {
      if (view === 'alcove') {
        stand.rotation.y = -azimuth
        stand.updateMatrixWorld()
      } else if (framing !== null) aimArenaCamera(camera, framing, azimuth)
      clock += seconds
      for (const top of tops) top.visible = false
      const landed = new Set<number>()
      const anchors: TagAnchor[] = []
      for (const drawn of arena.tops) {
        const top = tops[drawn.slot]
        if (top === undefined) continue
        if (drawn.fall >= 1) {
          landed.add(drawn.slot)
          if ((impacts[drawn.slot] ?? null) === null) {
            const pose = topPoseOf(drawn, heights)
            impacts[drawn.slot] = {
              at: clock,
              room: roomAround(pose.x, pose.z),
              x: pose.x,
              z: pose.z
            }
          }
          continue
        }
        impacts[drawn.slot] = null
        const spinAngle =
          (spinAngles[drawn.slot] ?? 0) +
          spinRate * topPoseOf(drawn).spinShare * seconds
        spinAngles[drawn.slot] = spinAngle
        placeTop({ drawn, heights, spinAngle, top })
        if (drawn.fall > 0) continue
        anchors.push(
          tagAnchorOf({
            azimuth,
            camera,
            canvas,
            slot: drawn.slot,
            stand,
            top,
            topHeight: heights.topHeight
          })
        )
      }
      for (const [slot, burst] of bursts.entries()) {
        const impact = impacts[slot] ?? null
        if (impact === null || !landed.has(slot)) {
          impacts[slot] = null
          burst.hide()
          continue
        }
        burst.show({ ...impact, elapsed: clock - impact.at })
      }
      renderer.render(scene, camera)
      return anchors
    },
    tune: (next) => {
      tuning = next
      applyTuning()
    }
  }
}
