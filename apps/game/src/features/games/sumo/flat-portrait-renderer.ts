import {
  AmbientLight,
  CircleGeometry,
  Color,
  DirectionalLight,
  Group,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NoToneMapping,
  type Object3D,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  RingGeometry,
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

import { prefersReducedMotion } from '@/infrastructure/browser'

import type { ArenaFrame, DrawnTop } from './arena-frame'
import type { CreateArenaRenderer, TagAnchor } from './arena-renderer'
import { SUMO_TUNING } from './sumo-tuning'

/** The plan's radii and filet widths, in arena units: the same plan the room sees before the scene loads. */
const PLAN = {
  centreRing: 0.503,
  centreSpot: 0.056,
  gutter: 1.14,
  gutterEdge: 1.135,
  rim: 0.991,
  tickRadius: 0.5,
  tickSize: 0.035,
  ticks: 8
} as const

const FIELD_OF_VIEW_DEGREES = 28
/** How far the camera leans from straight above, toward the people standing in front. */
const CAMERA_TILT_RADIANS = (14 * Math.PI) / 180
/** Room kept around the gutter so a falling top stays in frame. */
const FRAMING_MARGIN = 1.06

const TOP_RADIUS = SUMO_TUNING.topRadius
const TOP_HEIGHT = TOP_RADIUS * 1.2
/** About a turn every two seconds: alive, and the carved glyph stays readable. */
const SPIN_RADIANS_PER_SECOND = 3
const LEAN_PER_SPEED = 0.35
const MOST_LEAN_RADIANS = 0.3
const FALL_DEPTH = 0.35
const FALL_TIP_RADIANS = 1.2

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

const laidFlat = <TObject extends Object3D>(
  object: TObject,
  height: number
): TObject => {
  object.rotation.x = -Math.PI / 2
  object.position.y = height
  return object
}

/** A spinning top standing on its point: lacquered body, brass ring, cap and carved glyph. */
const buildTop = ({
  colors,
  ring,
  slot
}: {
  colors: SeatColors
  ring: Color
  slot: SeatSlot
}): Group => {
  const profile = [
    [0, 0],
    [0.12, 0.06],
    [0.55, 0.42],
    [0.93, 0.7],
    [1, 0.8],
    [0.97, 0.9],
    [0.8, 0.98],
    [0.66, 1]
  ].map(([x = 0, y = 0]) => new Vector2(x * TOP_RADIUS, y * TOP_HEIGHT))

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

const filet = ({
  color,
  opacity,
  radius,
  width
}: {
  color: Color
  opacity: number
  radius: number
  width: number
}): Mesh =>
  laidFlat(
    new Mesh(
      new RingGeometry(radius - width / 2, radius + width / 2, 160),
      new MeshBasicMaterial({
        color,
        depthWrite: false,
        opacity,
        transparent: true
      })
    ),
    0.0004
  )

/** The arena from above in unlit felt and brass filets: a plan, not a modelled object. */
const buildPlan = (read: (cssColor: string) => Color): Group => {
  const brass = read('var(--brass)')

  const occluder = laidFlat(
    new Mesh(
      new PlaneGeometry(40, 40),
      new MeshBasicMaterial({ colorWrite: false })
    ),
    0
  )
  occluder.renderOrder = -1
  const gutter = laidFlat(
    new Mesh(
      new CircleGeometry(PLAN.gutter, 160),
      new MeshBasicMaterial({ color: read('var(--felt-deep)') })
    ),
    0.0001
  )
  const platform = laidFlat(
    new Mesh(
      new CircleGeometry(SUMO_TUNING.arenaRadius, 160),
      new MeshBasicMaterial({
        color: read('color-mix(in oklab, var(--felt) 94%, var(--chalk))')
      })
    ),
    0.0002
  )

  const plan = new Group()
  plan.add(
    occluder,
    gutter,
    platform,
    filet({ color: brass, opacity: 1, radius: PLAN.rim, width: 0.018 }),
    filet({
      color: brass,
      opacity: 0.55,
      radius: PLAN.gutterEdge,
      width: 0.01
    }),
    filet({
      color: brass,
      opacity: 0.4,
      radius: PLAN.centreRing,
      width: 0.006
    }),
    filet({ color: brass, opacity: 1, radius: PLAN.centreSpot, width: 0.012 })
  )

  const tickMaterial = new MeshBasicMaterial({
    color: brass,
    depthWrite: false,
    opacity: 0.7,
    transparent: true
  })
  for (let tick = 0; tick < PLAN.ticks; tick++) {
    const angle = (tick * 2 * Math.PI) / PLAN.ticks
    const square = laidFlat(
      new Mesh(new PlaneGeometry(PLAN.tickSize, PLAN.tickSize), tickMaterial),
      0.0004
    )
    square.position.x = Math.cos(angle) * PLAN.tickRadius
    square.position.z = Math.sin(angle) * PLAN.tickRadius
    square.rotation.z = -angle
    plan.add(square)
  }

  return plan
}

const placeTop = ({
  drawn,
  spinAngle,
  top
}: {
  drawn: DrawnTop
  spinAngle: number
  top: Group
}): void => {
  const speed = Math.hypot(drawn.velocity.x, drawn.velocity.y)
  const lean =
    Math.min(speed * LEAN_PER_SPEED, MOST_LEAN_RADIANS) +
    drawn.fall * FALL_TIP_RADIANS
  const heading = Math.atan2(drawn.velocity.y, drawn.velocity.x)

  top.visible = true
  top.position.set(
    drawn.position.x,
    -drawn.fall * drawn.fall * FALL_DEPTH,
    drawn.position.y
  )
  top.rotation.set(0, -heading, 0)
  const spinning = top.children[0]
  if (spinning !== undefined) {
    spinning.rotation.set(0, 0, -lean)
    spinning.rotateY(spinAngle + heading)
  }
}

/** Projects the far edge of a top's crown (the top of it, as the room sees it) onto the canvas, in CSS pixels. */
const tagAnchorOf = ({
  camera,
  canvas,
  slot,
  top
}: {
  camera: PerspectiveCamera
  canvas: { height: number; width: number }
  slot: SeatSlot
  top: Group
}): TagAnchor => {
  const crown = new Vector3(
    top.position.x,
    top.position.y + TOP_HEIGHT,
    top.position.z - TOP_RADIUS
  ).project(camera)
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

const buildKeyLight = (color: Color): DirectionalLight => {
  const key = new DirectionalLight(color, 2.4)
  key.position.set(-0.7, 3, 1.1)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.radius = 5
  key.shadow.blurSamples = 16
  Object.assign(key.shadow.camera, {
    bottom: -PLAN.gutter,
    far: 6,
    left: -PLAN.gutter,
    near: 0.5,
    right: PLAN.gutter,
    top: PLAN.gutter
  })
  return key
}

/**
 * The default renderer: one flat portrait frame, for the HLD and any ordinary
 * screen. One perspective camera almost straight above the table, unlit felt
 * and brass for the plan, lacquered tops lit softly over grounded ink shadows.
 * The canvas stays transparent around the gutter: the page's felt is the backdrop.
 */
export const createFlatPortraitRenderer: CreateArenaRenderer = (host) => {
  const colors = createColorReader(host)
  const renderer = new WebGLRenderer({ alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = NoToneMapping
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFShadowMap
  renderer.domElement.classList.add('arena-canvas')
  host.append(renderer.domElement)

  const scene = new Scene()
  const environment = new PMREMGenerator(renderer)
  const reflections = environment.fromScene(new RoomEnvironment(), 0.04)
  scene.environment = reflections.texture
  scene.environmentIntensity = 0.55

  const shadowCatcher = laidFlat(
    new Mesh(
      new PlaneGeometry(2 * PLAN.gutter + 0.4, 2 * PLAN.gutter + 0.4),
      new ShadowMaterial({
        color: colors.read('var(--lacquer-ink)'),
        depthWrite: false,
        opacity: 0.38
      })
    ),
    0.0006
  )
  shadowCatcher.receiveShadow = true

  const ivory = colors.read('var(--ivory)')
  const ring = colors.read('var(--seat-top-ring)')
  const tops = Array.from({ length: ROOM_SEAT_LIMIT }, (_, slot) =>
    buildTop({ colors: colors.readSeat(slot), ring, slot })
  )

  scene.add(
    buildPlan(colors.read),
    shadowCatcher,
    new AmbientLight(ivory, 0.6),
    buildKeyLight(ivory),
    ...tops
  )

  const camera = new PerspectiveCamera(FIELD_OF_VIEW_DEGREES, 1, 0.1, 30)
  camera.up.set(0, 0, -1)

  const canvas = { height: 0, width: 0 }

  const frameTheTable = () => {
    const { clientHeight: height, clientWidth: width } = host
    if (width === 0 || height === 0) return
    canvas.height = height
    canvas.width = width
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    const halfVertical = (FIELD_OF_VIEW_DEGREES * Math.PI) / 360
    const halfHorizontal = Math.atan(Math.tan(halfVertical) * camera.aspect)
    const distance =
      ((PLAN.gutter + TOP_HEIGHT) * FRAMING_MARGIN) /
      Math.tan(Math.min(halfVertical, halfHorizontal))
    camera.position.set(
      0,
      Math.cos(CAMERA_TILT_RADIANS) * distance,
      Math.sin(CAMERA_TILT_RADIANS) * distance
    )
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }
  const resizing = new ResizeObserver(frameTheTable)
  resizing.observe(host)
  frameTheTable()

  const spinRate = prefersReducedMotion() ? 0 : SPIN_RADIANS_PER_SECOND
  let spinAngle = 0

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
    draw: (arena: ArenaFrame, seconds: number) => {
      spinAngle += spinRate * seconds
      for (const top of tops) top.visible = false
      const anchors: TagAnchor[] = []
      for (const drawn of arena.tops) {
        const top = tops[drawn.slot]
        if (top === undefined) continue
        placeTop({ drawn, spinAngle, top })
        anchors.push(tagAnchorOf({ camera, canvas, slot: drawn.slot, top }))
      }
      renderer.render(scene, camera)
      return anchors
    }
  }
}
