import {
  geoCentroid,
  geoDistance,
  geoEquirectangular,
  geoGraticule10,
  geoInterpolate,
  geoOrthographic,
  geoPath
} from 'd3-geo'
import {
  AmbientLight,
  CanvasTexture,
  CircleGeometry,
  type Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  HemisphereLight,
  type Material,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NoToneMapping,
  type Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  RingGeometry,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector3,
  WebGLRenderer
} from 'three'

import type { SeatId } from '@parallax/protocol/identifiers'
import type { SeatSlot } from '@parallax/protocol/room'

import { aimAlcoveCamera } from '@/features/alcove/aim-alcove-camera'
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
import { type GlobeAtlas, LAND_COLOURS, ringsOf } from './globe-atlas'
import type { GeoPoint } from './globe-distance'
import { type GlobeResult, type GlobeView, LOUPE_OPENS } from './globe-match'
import type { GlobeStand } from './globe-stand'

export type GlobeFrame = {
  readonly slotOf: (seat: SeatId) => SeatSlot | undefined
  /** `null` while the room gathers: the globe turns slowly by itself. */
  readonly view: GlobeView | null
}

export type GlobeRenderer = {
  dispose: () => void
  draw: (frame: GlobeFrame, seconds: number) => void
  /** Paints the world on the globe once the atlas has loaded; until then it is all ocean. */
  paint: (atlas: GlobeAtlas) => void
}

/** The map's texture, equirectangular, which lays exactly onto a sphere's UVs: 4K, so a Pi-class player still runs it. */
const MAP = { height: 2048, width: 4096 } as const
const LOUPE_PIXELS = 1024
/** How fast the idle globe turns, in degrees of longitude a second. */
const IDLE_DEGREES_A_SECOND = 6
/** The dashes of the way from the pin to the answer: each one's length, and its thickness, in alcove units. */
const DASH = { radius: 0.0032, step: 0.018 } as const
/** The arc between the pin and the answer rises this share of the radius at its middle. */
const ARC_LIFT = 0.06
const PIN = {
  answerHeight: 0.09,
  flag: 0.045,
  head: 0.018,
  pinHeight: 0.075,
  stem: 0.004
} as const

type Palette = {
  readonly accent: Color
  readonly border: Color
  readonly coast: Color
  readonly graticule: Color
  readonly ink: Color
  readonly lands: readonly Color[]
  readonly ocean: Color
  readonly shadow: Color
}

const css = (color: Color) => `#${color.getHexString(SRGBColorSpace)}`

/** A place on the unit sphere, in the `earth` group's frame: three's sphere puts longitude 0 on +X. */
const onSphere = ({ latitude, longitude }: GeoPoint, lift = 1): Vector3 => {
  const phi = MathUtils.degToRad(latitude)
  const lambda = MathUtils.degToRad(longitude)
  return new Vector3(
    Math.cos(phi) * Math.cos(lambda) * lift,
    Math.sin(phi) * lift,
    -Math.cos(phi) * Math.sin(lambda) * lift
  )
}

const ease = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)

const disposeTree = (root: Object3D) => {
  root.traverse((node) => {
    if (node instanceof Mesh) {
      node.geometry.dispose()
      const materials: Material[] = Array.isArray(node.material)
        ? node.material
        : [node.material]
      for (const material of materials) material.dispose()
    }
  })
}

/**
 * Terre in the alcove: a stylised Earth floating under the room's shelf,
 * painted in the school-atlas palette, turned so the place under the
 * crosshair faces the players. The loupe floats between the globe and them,
 * right over the crosshair; the reveal stands the player's pin in their
 * seat's colour, the answer's in ink, a dashed arc between. The floor and
 * the back wall only catch the globe's shadow.
 */
export const createGlobeRenderer = (
  host: HTMLElement,
  stand: GlobeStand,
  { hasShelf = false }: ShelfOption = {}
): GlobeRenderer => {
  const colors = createSceneColors(host)
  const palette: Palette = {
    accent: colors.read('var(--globe-accent)'),
    border: colors.read('var(--globe-border)'),
    coast: colors.read('var(--globe-coast)'),
    graticule: colors.read('var(--globe-graticule)'),
    ink: colors.read('var(--globe-ink)'),
    lands: Array.from({ length: LAND_COLOURS }, (_, index) =>
      colors.read(`var(--globe-land-${index + 1})`)
    ),
    ocean: colors.read('var(--globe-ocean)'),
    shadow: colors.read('var(--globe-shadow)')
  }

  const renderer = new WebGLRenderer({ alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = NoToneMapping
  enableSoftShadows(renderer)
  renderer.domElement.classList.add('scene-canvas')
  host.prepend(renderer.domElement)
  const anisotropy = renderer.capabilities.getMaxAnisotropy()

  const scene = new Scene()
  scene.add(
    buildAlcoveStage(SHIPPED_ALCOVE, {
      color: palette.shadow,
      floorOpacity: 0.42,
      wallOpacity: 0.16
    }),
    new HemisphereLight('#fffaf0', '#7a6a58', 1.25),
    new AmbientLight('#ffffff', 0.2)
  )
  // From the players' side, above and to the left: the globe's shadow falls back and down, on the floor and the wall.
  const key = new DirectionalLight('#ffffff', 1.9)
  key.position.set(-1.1, 2.6, 2.2)
  key.target.position.set(0, 0.6, -SHIPPED_ALCOVE.depth)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.bias = -0.0005
  Object.assign(key.shadow.camera, {
    bottom: -1.4,
    far: 7,
    left: -1.2,
    near: 0.5,
    right: 1.2,
    top: 1.4
  })
  softenShadow(key)
  scene.add(key, key.target)
  if (hasShelf) {
    scene.add(
      buildAlcoveShelf(SHIPPED_ALCOVE, {
        metal: colors.read('var(--host-line)'),
        wood: colors.read('var(--host-panel-frame)')
      })
    )
  }

  // ---------------------------------------------------------------- the map

  const mapCanvas = document.createElement('canvas')
  mapCanvas.width = MAP.width
  mapCanvas.height = MAP.height
  const mapPen = mapCanvas.getContext('2d')
  /** The map as painted, unmarked: what a highlighted country is put back from. */
  const cleanCanvas = document.createElement('canvas')
  cleanCanvas.width = MAP.width
  cleanCanvas.height = MAP.height
  const mapTexture = new CanvasTexture(mapCanvas)
  mapTexture.colorSpace = SRGBColorSpace
  mapTexture.anisotropy = anisotropy
  const flat = geoEquirectangular()
    .scale(MAP.width / (2 * Math.PI))
    .translate([MAP.width / 2, MAP.height / 2])
    .precision(0.1)

  if (mapPen !== null) {
    mapPen.fillStyle = css(palette.ocean)
    mapPen.fillRect(0, 0, MAP.width, MAP.height)
  }

  let atlas: GlobeAtlas | null = null
  /** Each shape's centre and how far its farthest point lies from it, in radians: the loupe skips what it cannot show. */
  let reach: { centre: [number, number]; far: number }[] = []
  /** The country painted in the accent, and the box to put back once the reveal ends. */
  let marked: {
    box: [[number, number], [number, number]]
    code: string
  } | null = null

  const strokeLines = (
    pen: CanvasRenderingContext2D,
    path: ReturnType<typeof geoPath>,
    scale: number
  ) => {
    if (atlas === null) return
    pen.lineJoin = 'round'
    pen.beginPath()
    path(atlas.borders)
    pen.strokeStyle = css(palette.border)
    pen.lineWidth = 2.6 * scale
    pen.stroke()
    pen.beginPath()
    path(atlas.coasts)
    pen.strokeStyle = css(palette.coast)
    pen.lineWidth = 3.4 * scale
    pen.stroke()
  }

  const paintMap = () => {
    if (mapPen === null || atlas === null) return
    const path = geoPath(flat, mapPen)
    mapPen.fillStyle = css(palette.ocean)
    mapPen.fillRect(0, 0, MAP.width, MAP.height)
    mapPen.beginPath()
    path(geoGraticule10())
    mapPen.strokeStyle = css(palette.graticule)
    mapPen.lineWidth = 2
    mapPen.stroke()
    for (const country of atlas.countries) {
      mapPen.beginPath()
      path(country.feature)
      mapPen.fillStyle = css(palette.lands[country.colour] ?? palette.ocean)
      mapPen.fill()
    }
    strokeLines(mapPen, path, 1)
    cleanCanvas.getContext('2d')?.drawImage(mapCanvas, 0, 0)
    mapTexture.needsUpdate = true
  }

  /** Paints the asked country in the accent, or puts the last one back with `null`. */
  const markCountry = (code: string | null) => {
    if (mapPen === null || atlas === null || marked?.code === code) return
    if (marked !== null) {
      const [[left, top], [right, bottom]] = marked.box
      mapPen.drawImage(
        cleanCanvas,
        left,
        top,
        right - left,
        bottom - top,
        left,
        top,
        right - left,
        bottom - top
      )
      marked = null
    }
    if (code !== null) {
      const path = geoPath(flat, mapPen)
      const shapes = atlas.countries.filter((country) => country.code === code)
      let box: [[number, number], [number, number]] = [
        [MAP.width, MAP.height],
        [0, 0]
      ]
      for (const { feature } of shapes) {
        const [[left, top], [right, bottom]] = path.bounds(feature)
        box = [
          [Math.min(box[0][0], left), Math.min(box[0][1], top)],
          [Math.max(box[1][0], right), Math.max(box[1][1], bottom)]
        ]
      }
      const pad = 6
      const clipped: [[number, number], [number, number]] = [
        [
          Math.max(0, Math.floor(box[0][0] - pad)),
          Math.max(0, Math.floor(box[0][1] - pad))
        ],
        [
          Math.min(MAP.width, Math.ceil(box[1][0] + pad)),
          Math.min(MAP.height, Math.ceil(box[1][1] + pad))
        ]
      ]
      mapPen.save()
      mapPen.beginPath()
      mapPen.rect(
        clipped[0][0],
        clipped[0][1],
        clipped[1][0] - clipped[0][0],
        clipped[1][1] - clipped[0][1]
      )
      mapPen.clip()
      for (const { feature } of shapes) {
        mapPen.beginPath()
        path(feature)
        mapPen.fillStyle = css(palette.accent)
        mapPen.fill()
      }
      strokeLines(mapPen, path, 1)
      mapPen.restore()
      marked = { box: clipped, code }
    }
    mapTexture.needsUpdate = true
  }

  // ---------------------------------------------------------------- the globe

  /** `globe` turns +Z onto the players' eye and carries the size; `earth` inside it turns the map. */
  const facing = new Vector3(stand.facing.x, stand.facing.y, stand.facing.z)
  const centre = new Vector3(stand.centre.x, stand.centre.y, stand.centre.z)
  const globe = new Group()
  const earth = new Group()
  globe.add(earth)
  globe.position.copy(centre)
  globe.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), facing)
  globe.scale.setScalar(stand.radius)
  scene.add(globe)
  const sphere = new Mesh(
    new SphereGeometry(1, 160, 112),
    new MeshStandardMaterial({ map: mapTexture, metalness: 0, roughness: 0.82 })
  )
  sphere.castShadow = true
  earth.add(sphere)

  // The crosshair: a ring held just off the globe's nearest point, facing the players.
  const crosshair = new Group()
  const crosshairInk = new MeshBasicMaterial({ color: palette.accent })
  crosshair.add(new Mesh(new RingGeometry(0.016, 0.0215, 64), crosshairInk))
  crosshair.add(new Mesh(new CircleGeometry(0.0035, 24), crosshairInk))
  for (const angle of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const tick = new Mesh(new PlaneGeometry(0.011, 0.0032), crosshairInk)
    tick.position.set(Math.cos(angle) * 0.0275, Math.sin(angle) * 0.0275, 0)
    tick.rotation.z = angle
    crosshair.add(tick)
  }
  crosshair.quaternion.copy(globe.quaternion)
  crosshair.position.copy(centre).addScaledVector(facing, stand.radius + 0.004)
  crosshair.visible = false
  scene.add(crosshair)

  // ---------------------------------------------------------------- the loupe

  // A magnifier floating between the globe and the players, right over the crosshair, so the magnified
  // ground sits where it really is. Its glass is a flat picture of the globe seen from straight above the
  // crosshair, redrawn only when the aim or the magnification moves.
  const loupeCanvas = document.createElement('canvas')
  loupeCanvas.width = LOUPE_PIXELS
  loupeCanvas.height = LOUPE_PIXELS
  const loupePen = loupeCanvas.getContext('2d')
  const loupeTexture = new CanvasTexture(loupeCanvas)
  loupeTexture.colorSpace = SRGBColorSpace
  const loupe = new Group()
  const glass = new Mesh(
    new CircleGeometry(stand.loupeRadius, 96),
    new MeshBasicMaterial({ map: loupeTexture })
  )
  const rimPaint = new MeshStandardMaterial({
    color: palette.ink,
    metalness: 0.4,
    roughness: 0.35
  })
  const rim = new Mesh(
    new TorusGeometry(stand.loupeRadius + 0.006, 0.009, 18, 120),
    rimPaint
  )
  const handle = new Mesh(
    new CylinderGeometry(0.011, 0.014, 0.12, 20),
    rimPaint
  )
  const handleAngle = -Math.PI / 4
  handle.position.set(
    Math.cos(handleAngle) * (stand.loupeRadius + 0.07),
    Math.sin(handleAngle) * (stand.loupeRadius + 0.07),
    0
  )
  handle.rotation.z = handleAngle + Math.PI / 2
  rim.castShadow = true
  handle.castShadow = true
  loupe.add(glass, rim, handle)
  loupe.quaternion.copy(globe.quaternion)
  loupe.position
    .copy(centre)
    .addScaledVector(facing, stand.radius + stand.loupeGap)
  loupe.visible = false
  scene.add(loupe)
  let loupeDrawn = ''

  const drawLoupe = (aim: GeoPoint, magnify: number) => {
    const drawnKey = `${aim.latitude.toFixed(3)},${aim.longitude.toFixed(3)},${magnify.toFixed(3)},${atlas === null}`
    if (drawnKey === loupeDrawn || loupePen === null) return
    loupeDrawn = drawnKey
    const half = LOUPE_PIXELS / 2
    const projection = geoOrthographic()
      .rotate([-aim.longitude, -aim.latitude])
      .translate([half, half])
      .scale((magnify * stand.radius * half) / stand.loupeRadius)
      .clipAngle(90)
      .precision(0.3)
    const path = geoPath(projection, loupePen)
    loupePen.fillStyle = css(palette.ocean)
    loupePen.fillRect(0, 0, LOUPE_PIXELS, LOUPE_PIXELS)
    loupePen.beginPath()
    path(geoGraticule10())
    loupePen.strokeStyle = css(palette.graticule)
    loupePen.lineWidth = 1.5
    loupePen.stroke()
    if (atlas !== null) {
      // Only the countries near the crosshair: the glass shows a few thousand km at most.
      const seen = (stand.loupeRadius / (magnify * stand.radius)) * 1.6
      const at: [number, number] = [aim.longitude, aim.latitude]
      for (const [index, country] of atlas.countries.entries()) {
        const shape = reach[index]
        if (
          shape === undefined ||
          geoDistance(shape.centre, at) - shape.far > seen
        ) {
          continue
        }
        loupePen.beginPath()
        path(country.feature)
        loupePen.fillStyle = css(palette.lands[country.colour] ?? palette.ocean)
        loupePen.fill()
      }
      strokeLines(loupePen, path, 0.8)
    }
    // The crosshair, at the glass's centre.
    loupePen.strokeStyle = css(palette.accent)
    loupePen.fillStyle = css(palette.accent)
    loupePen.lineWidth = 7
    loupePen.beginPath()
    loupePen.arc(half, half, 46, 0, Math.PI * 2)
    loupePen.stroke()
    loupePen.beginPath()
    loupePen.arc(half, half, 7, 0, Math.PI * 2)
    loupePen.fill()
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ] as const) {
      loupePen.beginPath()
      loupePen.moveTo(half + dx * 56, half + dy * 56)
      loupePen.lineTo(half + dx * 84, half + dy * 84)
      loupePen.stroke()
    }
    // A soft darkening toward the rim, like curved glass.
    const vignette = loupePen.createRadialGradient(
      half,
      half,
      half * 0.7,
      half,
      half,
      half
    )
    vignette.addColorStop(0, 'rgba(0,0,0,0)')
    vignette.addColorStop(1, 'rgba(0,0,0,0.22)')
    loupePen.fillStyle = vignette
    loupePen.fillRect(0, 0, LOUPE_PIXELS, LOUPE_PIXELS)
    loupeTexture.needsUpdate = true
  }

  // ---------------------------------------------------------------- the reveal

  const reveal = new Group()
  earth.add(reveal)
  let revealed: GlobeResult | null = null

  const buildPin = (color: Color, height: number): Group => {
    const pin = new Group()
    const paint = new MeshStandardMaterial({ color, roughness: 0.45 })
    const stem = new Mesh(
      new CylinderGeometry(PIN.stem, PIN.stem, height, 10),
      paint
    )
    stem.position.y = height / 2
    const head = new Mesh(new SphereGeometry(PIN.head, 20, 14), paint)
    head.position.y = height
    stem.castShadow = true
    head.castShadow = true
    pin.add(stem, head)
    return pin
  }

  /** The answer: a red pennant on an ink pole, which no seat's pin is mistaken for. */
  const buildFlag = (): Group => {
    const flag = new Group()
    const pole = new Mesh(
      new CylinderGeometry(PIN.stem, PIN.stem, PIN.answerHeight, 10),
      new MeshStandardMaterial({ color: palette.ink, roughness: 0.45 })
    )
    pole.position.y = PIN.answerHeight / 2
    const cloth = new Mesh(
      new PlaneGeometry(PIN.flag, PIN.flag * 0.62),
      new MeshStandardMaterial({
        color: palette.accent,
        roughness: 0.6,
        side: DoubleSide
      })
    )
    cloth.position.set(
      PIN.flag / 2,
      PIN.answerHeight - (PIN.flag * 0.62) / 2,
      0
    )
    pole.castShadow = true
    cloth.castShadow = true
    flag.add(pole, cloth)
    return flag
  }

  /** Stands a pin on the unit sphere; the globe's scale would stretch it, so it is scaled back to its size. */
  const plantPin = (pin: Group, at: GeoPoint) => {
    pin.position.copy(onSphere(at))
    pin.quaternion.setFromUnitVectors(
      new Vector3(0, 1, 0),
      pin.position.clone().normalize()
    )
    pin.scale.setScalar(1 / stand.radius)
    reveal.add(pin)
  }

  const showResult = (
    result: GlobeResult | null,
    slot: SeatSlot | undefined
  ) => {
    if (result === revealed) return
    revealed = result
    disposeTree(reveal)
    reveal.clear()
    markCountry(result?.place.kind === 'country' ? result.place.country : null)
    if (result === null) return
    plantPin(
      buildPin(
        slot === undefined ? palette.accent : colors.readSeat(slot),
        PIN.pinHeight
      ),
      result.pin
    )
    if (result.answer === null) return
    if (result.place.kind !== 'country') {
      plantPin(buildFlag(), result.answer)
    }
    // The way between, dashed in thin rods lifted off the ground: a 1 px line does not read across a room.
    const between = geoInterpolate(
      [result.pin.longitude, result.pin.latitude],
      [result.answer.longitude, result.answer.latitude]
    )
    const angle = geoDistance(
      [result.pin.longitude, result.pin.latitude],
      [result.answer.longitude, result.answer.latitude]
    )
    const steps = Math.max(
      4,
      2 * Math.round((angle * stand.radius) / DASH.step / 2)
    )
    const dashPaint = new MeshStandardMaterial({
      color: palette.ink,
      roughness: 0.5
    })
    const pointAt = (step: number) => {
      const [longitude, latitude] = between(step / steps)
      return onSphere(
        { latitude, longitude },
        1 + ARC_LIFT * Math.sin((Math.PI * step) / steps)
      )
    }
    for (let step = 0; step < steps; step += 2) {
      const from = pointAt(step)
      const to = pointAt(step + 1)
      const along = to.clone().sub(from)
      const dash = new Mesh(
        new CylinderGeometry(
          DASH.radius / stand.radius,
          DASH.radius / stand.radius,
          along.length(),
          8
        ),
        dashPaint
      )
      dash.position.copy(from).addScaledVector(along, 0.5)
      dash.quaternion.setFromUnitVectors(
        new Vector3(0, 1, 0),
        along.normalize()
      )
      dash.castShadow = true
      reveal.add(dash)
    }
  }

  // ---------------------------------------------------------------- the camera

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

  const idle = { latitude: 20, longitude: 10 }

  return {
    dispose: () => {
      resizing.disconnect()
      disposeTree(scene)
      mapTexture.dispose()
      loupeTexture.dispose()
      renderer.dispose()
      renderer.domElement.remove()
      colors.dispose()
    },
    draw: ({ slotOf, view }, seconds) => {
      let aim: GeoPoint
      if (view === null) {
        idle.longitude =
          ((idle.longitude + IDLE_DEGREES_A_SECOND * seconds + 540) % 360) - 180
        aim = idle
        showResult(null, undefined)
      } else {
        aim = view.aim
        showResult(
          view.result,
          view.result === null ? undefined : slotOf(view.result.seat)
        )
      }
      earth.rotation.set(
        MathUtils.degToRad(aim.latitude),
        -Math.PI / 2 - MathUtils.degToRad(aim.longitude),
        0,
        'XYZ'
      )
      const isAiming = view?.phase === 'aiming'
      const isLoupeShown = isAiming && view.loupe !== null
      crosshair.visible = isAiming && !isLoupeShown
      loupe.visible = isLoupeShown
      if (isLoupeShown && view.loupe !== null) {
        // The loupe grows out of the crosshair as it opens, and shrinks back into it.
        const opening = MathUtils.clamp((view.zoom - LOUPE_OPENS) / 0.2, 0, 1)
        loupe.scale.setScalar(0.15 + 0.85 * ease(opening))
        drawLoupe(aim, view.loupe)
      }
      renderer.render(scene, camera)
    },
    paint: (loaded) => {
      atlas = loaded
      reach = loaded.countries.map(({ feature }) => {
        const middle = geoCentroid(feature)
        let far = 0
        for (const ring of ringsOf(feature.geometry)) {
          for (const [longitude, latitude] of ring) {
            far = Math.max(far, geoDistance([longitude, latitude], middle))
          }
        }
        return { centre: middle, far }
      })
      marked = null
      revealed = null
      loupeDrawn = ''
      paintMap()
    }
  }
}
