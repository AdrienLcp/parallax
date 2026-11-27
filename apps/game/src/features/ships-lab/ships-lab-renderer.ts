import {
  AdditiveBlending,
  AmbientLight,
  BackSide,
  BoxGeometry,
  BufferGeometry,
  Color,
  ConeGeometry,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  IcosahedronGeometry,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NoToneMapping,
  PerspectiveCamera,
  RingGeometry,
  Scene,
  Shape,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer
} from 'three'

import type { SeatSlot } from '@parallax/protocol/room'

import { aimAlcoveCamera } from '@/features/alcove/aim-alcove-camera'
import {
  enableSoftShadows,
  softenShadow
} from '@/features/alcove/alcove-soft-shadows'
import { buildAlcoveStage } from '@/features/alcove/alcove-stage'
import { SHIPPED_ALCOVE } from '@/features/alcove/shipped-alcove'
import { createSceneColors } from '@/features/games/scene-colors'

import { FLIGHT, type FlightWorld, shipAttitude } from './ships-lab-flight'

export type ShipsLabRenderer = {
  dispose: () => void
  draw: (world: FlightWorld, slot: SeatSlot | null, seconds: number) => void
}

const ALCOVE = SHIPPED_ALCOVE

const shipShape = (): ExtrudeGeometry => {
  const shape = new Shape()
  shape.moveTo(0, 0.05)
  shape.lineTo(0.017, 0.006)
  shape.lineTo(0.038, -0.03)
  shape.lineTo(0.014, -0.02)
  shape.lineTo(0, -0.028)
  shape.lineTo(-0.014, -0.02)
  shape.lineTo(-0.038, -0.03)
  shape.lineTo(-0.017, 0.006)
  shape.closePath()
  const geometry = new ExtrudeGeometry(shape, {
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.003,
    bevelThickness: 0.004,
    depth: 0.01
  })
  geometry.translate(0, 0, -0.005)
  return geometry
}

/**
 * The box the unit's optics show, drawn: on an ordinary monitor there is no
 * alcove behind the screen, so its floor, walls and roof stand in for it,
 * lit by the scene and catching its shadows.
 */
const buildDrawnAlcove = (): Group => {
  const { depth, height } = ALCOVE
  const box = new Mesh(
    new BoxGeometry(1, height, depth),
    new MeshStandardMaterial({
      color: '#3a4152',
      metalness: 0,
      roughness: 0.95,
      side: BackSide
    })
  )
  box.position.set(0, height / 2, -depth / 2)
  box.receiveShadow = true
  // The opening's rim: the screen's bezel seen from the players.
  const rimPoints = [
    new Vector3(-0.5, 0, 0),
    new Vector3(0.5, 0, 0),
    new Vector3(0.5, height, 0),
    new Vector3(-0.5, height, 0),
    new Vector3(-0.5, 0, 0)
  ]
  const rim = new Line(
    new BufferGeometry().setFromPoints(rimPoints),
    new LineBasicMaterial({ color: '#7d8699' })
  )
  const backEdges = rimPoints.map((point) => point.clone().setZ(-depth))
  const back = new Line(
    new BufferGeometry().setFromPoints(backEdges),
    new LineBasicMaterial({ color: '#59617a' })
  )
  const group = new Group()
  group.add(box, rim, back)
  return group
}

/** Where the ray from `from` along `direction` meets the box's floor, walls, roof or opening. */
const wallHit = (from: Vector3, direction: Vector3): Vector3 => {
  const { depth, height } = ALCOVE
  let nearest = Number.POSITIVE_INFINITY
  const planes: [axis: 'x' | 'y' | 'z', at: number][] = [
    ['x', -0.5],
    ['x', 0.5],
    ['y', 0],
    ['y', height],
    ['z', -depth],
    ['z', 0]
  ]
  for (const [axis, at] of planes) {
    const along = direction[axis]
    if (Math.abs(along) < 1e-6) continue
    const t = (at - from[axis]) / along
    if (t > 1e-4 && t < nearest) nearest = t
  }
  return from.clone().addScaledVector(direction, nearest)
}

type Spark = {
  life: number
  readonly mesh: Mesh
  readonly total: number
  readonly velocity: Vector3
}

export const createShipsLabRenderer = (
  host: HTMLElement,
  { isOnUnit }: { isOnUnit: boolean }
): ShipsLabRenderer => {
  const colors = createSceneColors(host)
  const renderer = new WebGLRenderer({ alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = NoToneMapping
  enableSoftShadows(renderer)
  renderer.domElement.classList.add('scene-canvas')
  host.prepend(renderer.domElement)

  const scene = new Scene()
  const camera = new PerspectiveCamera()
  scene.add(
    isOnUnit
      ? buildAlcoveStage(ALCOVE, {
          color: new Color('#000000'),
          floorOpacity: 0.38,
          wallOpacity: 0
        })
      : buildDrawnAlcove(),
    new HemisphereLight('#cfd8ff', '#202030', 1.1),
    new AmbientLight('#ffffff', 0.15)
  )
  // Overhead: the ship's shadow lands on its floor ring, right under it.
  const sun = new DirectionalLight('#ffffff', 2.2)
  sun.position.set(0.15, ALCOVE.height + 2.4, -ALCOVE.depth / 2 + 0.35)
  sun.target.position.set(0, 0, -ALCOVE.depth / 2)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.bias = -0.0005
  Object.assign(sun.shadow.camera, {
    bottom: -1.6,
    far: 5,
    left: -1.4,
    near: 0.2,
    right: 1.4,
    top: 1.6
  })
  softenShadow(sun)
  const rimLight = new DirectionalLight('#9fb4ff', 0.8)
  rimLight.position.set(-1, 1, 3)
  scene.add(sun, sun.target, rimLight)

  // ------------------------------------------------------------- the ship

  const seatColor = new Color('#ff4d6d')
  const farTint = new Color('#0d1018')
  const ship = new Group()
  const hullMaterial = new MeshStandardMaterial({
    color: seatColor,
    emissive: seatColor,
    emissiveIntensity: 0.12,
    metalness: 0.35,
    roughness: 0.35
  })
  const hull = new Mesh(shipShape(), hullMaterial)
  hull.castShadow = true
  const cockpit = new Mesh(
    new SphereGeometry(0.009, 16, 10),
    new MeshStandardMaterial({
      color: '#e8f0ff',
      emissive: '#9fc3ff',
      emissiveIntensity: 0.4,
      metalness: 0.1,
      roughness: 0.1
    })
  )
  cockpit.position.set(0, 0.006, 0.008)
  cockpit.scale.set(1, 1.6, 0.8)
  const flameGeometry = new ConeGeometry(0.009, 0.04, 10)
  flameGeometry.translate(0, -0.02, 0)
  flameGeometry.rotateZ(Math.PI)
  const flameMaterial = new MeshBasicMaterial({
    color: '#ffd38a',
    opacity: 0.9,
    transparent: true
  })
  const flame = new Mesh(flameGeometry, flameMaterial)
  flame.position.set(0, -0.028, 0)
  ship.add(hull, cockpit, flame)

  const stalkMaterial = new LineBasicMaterial({
    color: seatColor,
    opacity: 0.45,
    transparent: true
  })
  const stalk = new Line(
    new BufferGeometry().setFromPoints([new Vector3(), new Vector3()]),
    stalkMaterial
  )
  const markMaterial = new MeshBasicMaterial({
    color: seatColor,
    depthWrite: false,
    opacity: 0.85,
    side: DoubleSide,
    transparent: true
  })
  const ringGeometry = new RingGeometry(0.018, 0.028, 32)
  const mark = new Mesh(ringGeometry, markMaterial)
  mark.rotation.x = -Math.PI / 2

  // Where the nose points, in `pilot`: a beam to the wall it meets, and a dot there.
  const beamMaterial = new LineBasicMaterial({
    color: seatColor,
    opacity: 0.35,
    transparent: true
  })
  const beam = new Line(
    new BufferGeometry().setFromPoints([new Vector3(), new Vector3()]),
    beamMaterial
  )
  const beamDot = new Mesh(
    new SphereGeometry(0.008, 12, 8),
    new MeshBasicMaterial({ color: seatColor })
  )
  scene.add(ship, stalk, mark, beam, beamDot)

  // -------------------------------------------------------------- targets

  const targetGeometry = new IcosahedronGeometry(FLIGHT.targetRadius, 0)
  const targetMaterial = new MeshStandardMaterial({
    color: '#f5d76e',
    emissive: '#f5b84a',
    emissiveIntensity: 0.25,
    flatShading: true,
    roughness: 0.5
  })
  const targetMarkMaterial = new MeshBasicMaterial({
    color: '#f5d76e',
    depthWrite: false,
    opacity: 0.6,
    side: DoubleSide,
    transparent: true
  })
  const targetStalkMaterial = new LineBasicMaterial({
    color: '#f5d76e',
    opacity: 0.3,
    transparent: true
  })
  const targetViews = Array.from({ length: FLIGHT.targetCount }, () => {
    const body = new Mesh(targetGeometry, targetMaterial)
    body.castShadow = true
    const ring = new Mesh(ringGeometry, targetMarkMaterial)
    ring.rotation.x = -Math.PI / 2
    const line = new Line(
      new BufferGeometry().setFromPoints([new Vector3(), new Vector3()]),
      targetStalkMaterial
    )
    scene.add(body, ring, line)
    return { body, line, ring }
  })

  // -------------------------------------------------------- bullets, sparks

  const bulletGeometry = new SphereGeometry(FLIGHT.bulletRadius, 12, 8)
  const bulletMaterial = new MeshBasicMaterial({ color: '#ffffff' })
  const glowMaterial = new MeshBasicMaterial({
    blending: AdditiveBlending,
    color: seatColor,
    depthWrite: false,
    opacity: 0.5,
    transparent: true
  })
  const bulletPool: Mesh[] = []
  const bulletAt = (index: number): Mesh => {
    const existing = bulletPool[index]
    if (existing !== undefined) return existing
    const bullet = new Mesh(bulletGeometry, bulletMaterial)
    const glow = new Mesh(bulletGeometry, glowMaterial)
    glow.scale.setScalar(1.8)
    bullet.add(glow)
    scene.add(bullet)
    bulletPool.push(bullet)
    return bullet
  }

  const sparkGeometry = new SphereGeometry(1, 8, 6)
  const sparkMaterials = {
    hit: new MeshBasicMaterial({ color: '#ffe08a' }),
    trail: glowMaterial,
    wall: new MeshBasicMaterial({ color: '#c9d4ff' })
  }
  const sparks: Spark[] = []
  const spark = (
    at: Vector3,
    velocity: Vector3,
    size: number,
    life: number,
    kind: keyof typeof sparkMaterials
  ) => {
    const mesh = new Mesh(sparkGeometry, sparkMaterials[kind])
    mesh.position.copy(at)
    mesh.scale.setScalar(size)
    scene.add(mesh)
    sparks.push({ life, mesh, total: life, velocity })
  }
  let trailClock = 0

  // --------------------------------------------------------------- sizing

  const canvas = renderer.domElement
  const fitToHost = () => {
    const width = host.clientWidth
    const height = host.clientHeight
    if (width === 0 || height === 0) return
    renderer.setSize(width, height, false)
    aimAlcoveCamera(camera, ALCOVE, { height, width })
  }
  const resizing = new ResizeObserver(fitToHost)
  resizing.observe(host)
  fitToHost()

  let paintedSlot: SeatSlot | null = null
  let lastSeconds: number | null = null

  const draw = (world: FlightWorld, slot: SeatSlot | null, seconds: number) => {
    const dt = lastSeconds === null ? 0 : Math.min(0.05, seconds - lastSeconds)
    lastSeconds = seconds

    if (slot !== null && slot !== paintedSlot) {
      paintedSlot = slot
      seatColor.copy(colors.readSeat(slot))
      for (const material of [
        stalkMaterial,
        markMaterial,
        beamMaterial,
        glowMaterial,
        beamDot.material
      ]) {
        material.color.copy(seatColor)
      }
      hullMaterial.emissive.copy(seatColor)
    }

    const { bounds } = world
    const state = world.ship
    ship.position.copy(state.position)
    ship.quaternion.copy(shipAttitude(world))
    const near =
      (state.position.z - bounds.min.z) / (bounds.max.z - bounds.min.z)
    hullMaterial.color.copy(seatColor).lerp(farTint, (1 - near) * 0.45)
    hullMaterial.emissiveIntensity = 0.04 + near * 0.3
    flame.scale.set(
      1,
      0.4 + state.thrust * 1.4 + Math.sin(seconds * 40) * 0.15,
      1
    )
    flameMaterial.opacity = 0.25 + state.thrust * 0.7

    const stalkEnds = stalk.geometry.attributes.position
    stalkEnds?.setXYZ(
      0,
      state.position.x,
      state.position.y - 0.035,
      state.position.z
    )
    stalkEnds?.setXYZ(1, state.position.x, 0.002, state.position.z)
    if (stalkEnds !== undefined) stalkEnds.needsUpdate = true
    mark.position.set(state.position.x, 0.002, state.position.z)

    const isPilot = world.mode === 'pilot'
    beam.visible = isPilot
    beamDot.visible = isPilot
    if (isPilot) {
      const from = state.position.clone().addScaledVector(state.forward, 0.05)
      const hit = wallHit(from, state.forward)
      const beamEnds = beam.geometry.attributes.position
      beamEnds?.setXYZ(0, from.x, from.y, from.z)
      beamEnds?.setXYZ(1, hit.x, hit.y, hit.z)
      if (beamEnds !== undefined) beamEnds.needsUpdate = true
      beamDot.position.copy(hit)
      beamDot.visible = hit.z < -1e-3
    }

    world.targets.forEach((target, index) => {
      const view = targetViews[index]
      if (view === undefined) return
      const isShown = target.away <= 0
      view.body.visible = isShown
      view.ring.visible = isShown
      view.line.visible = isShown
      if (!isShown) return
      view.body.position.copy(target.position)
      view.body.rotation.set(seconds * 0.7 + index, seconds * 0.9, 0)
      view.ring.position.set(target.position.x, 0.002, target.position.z)
      const ends = view.line.geometry.attributes.position
      ends?.setXYZ(
        0,
        target.position.x,
        target.position.y - FLIGHT.targetRadius,
        target.position.z
      )
      ends?.setXYZ(1, target.position.x, 0.002, target.position.z)
      if (ends !== undefined) ends.needsUpdate = true
    })

    bulletPool.forEach((bullet, index) => {
      bullet.visible = index < world.bullets.length
    })
    world.bullets.forEach((bullet, index) => {
      bulletAt(index).position.copy(bullet.position)
      bulletAt(index).visible = true
    })

    for (const burst of world.bursts.splice(0)) {
      const count = burst.kind === 'hit' ? 26 : 3
      const speed = burst.kind === 'hit' ? 0.6 : 0.15
      for (let index = 0; index < count; index += 1) {
        spark(
          burst.at,
          new Vector3()
            .randomDirection()
            .multiplyScalar(speed * (0.3 + Math.random())),
          0.004 + Math.random() * 0.006,
          0.35 + Math.random() * 0.45,
          burst.kind
        )
      }
    }
    trailClock -= dt
    if (state.thrust > 0.15 && trailClock <= 0) {
      trailClock = 0.025
      const tail = state.position.clone().addScaledVector(state.forward, -0.03)
      spark(tail, new Vector3(), 0.006 * (0.5 + state.thrust), 0.45, 'trail')
    }
    for (let index = sparks.length - 1; index >= 0; index -= 1) {
      const item = sparks[index]
      if (item === undefined) continue
      item.life -= dt
      item.mesh.position.addScaledVector(item.velocity, dt)
      item.velocity.multiplyScalar(Math.exp(-2.5 * dt))
      item.mesh.scale.multiplyScalar(
        Math.max(0.0001, item.life / item.total) /
          Math.max(0.0001, (item.life + dt) / item.total)
      )
      if (item.life <= 0) {
        scene.remove(item.mesh)
        sparks.splice(index, 1)
      }
    }

    renderer.render(scene, camera)
  }

  return {
    dispose: () => {
      resizing.disconnect()
      colors.dispose()
      scene.traverse((node) => {
        if (node instanceof Mesh || node instanceof Line) {
          node.geometry.dispose()
          const materials = Array.isArray(node.material)
            ? node.material
            : [node.material]
          for (const material of materials) material.dispose()
        }
      })
      renderer.dispose()
      canvas.remove()
    },
    draw
  }
}
