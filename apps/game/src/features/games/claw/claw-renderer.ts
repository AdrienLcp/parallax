import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  type Group,
  HemisphereLight,
  type Material,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NoToneMapping,
  type Object3D,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer
} from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

import type { SeatId } from '@parallax/protocol/identifiers'
import { ROOM_SEAT_LIMIT, type SeatSlot } from '@parallax/protocol/room'

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
import { buildConfetti } from './claw-confetti'
import { type ClawMatchView, PRIZE_TINTS, type Prize } from './claw-match'
import {
  buildCapsule,
  buildChute,
  buildClaw,
  buildPlush,
  CLAW_CROWN,
  type ClawModel,
  disposeSharedGeometries,
  furMaterial
} from './claw-models'
import { CHUTE_SIZE, CLAW_REACH, type ClawPit, RAIL_SIZE } from './claw-pit'

/** Where each claw's name tag sits on the canvas, in CSS pixels. */
export type ClawAnchors = ReadonlyMap<
  SeatId,
  { readonly x: number; readonly y: number }
>

export type ClawFrame = {
  readonly slotOf: (seat: SeatId) => SeatSlot | undefined
  readonly view: ClawMatchView
}

export type ClawRenderer = {
  dispose: () => void
  /** Draws the frame, `seconds` after the last; answers each claw's tag anchor for the DOM over the canvas. */
  draw: (frame: ClawFrame, seconds: number) => ClawAnchors
}

/** The plush's fur, warm browns and creams under the arcade's candy. */
const FUR = ['#c8935a', '#9c9ea3', '#ece6da', '#6e4a33', '#d9b98c', '#b48a6a']
/** How long a new prize takes to grow in. */
const GROW_SECONDS = 0.35
/** Confetti pieces a prize thrown into a chute sets off: a capsule, worth more, sets off more. */
const CONFETTI = { capsule: 100, plush: 55 } as const
/** How long after a catch its scorer's colour still tints the confetti. */
const CATCH_COLOUR_SECONDS = 2

type ClawRig = {
  readonly bar: Mesh
  readonly carriage: Mesh
  readonly model: ClawModel
  readonly slot: SeatSlot | undefined
}

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
 * The claw machine in the alcove, borne style under shop lights: a pile of
 * plush and candy capsules on the real floor, candy rails flat against the
 * real roof, one chrome claw a player hung from its bar and carriage, a chute
 * in each front corner. The floor and the back wall only catch shadows: the
 * optics show the real ones.
 */
export const createClawRenderer = (
  host: HTMLElement,
  pit: ClawPit,
  { hasShelf = false }: ShelfOption = {}
): ClawRenderer => {
  const colors = createSceneColors(host)
  const renderer = new WebGLRenderer({ alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = NoToneMapping
  enableSoftShadows(renderer)
  renderer.domElement.classList.add('scene-canvas')
  host.prepend(renderer.domElement)

  const scene = new Scene()
  const environment = new PMREMGenerator(renderer)
  const reflections = environment.fromScene(new RoomEnvironment(), 0.04)
  scene.environment = reflections.texture
  scene.environmentIntensity = 0.8
  environment.dispose()

  const candy = colors.read('var(--arcade-candy-lit, oklch(68.5% 0.22 357))')
  const cyan = colors.read('var(--arcade-cyan-lit, oklch(80% 0.12 203))')
  const lemon = colors.read('var(--arcade-lemon, oklch(95.6% 0.1 104))')
  const chrome = colors.read('var(--arcade-chrome, oklch(84.9% 0.012 258))')
  const shadowTint = colors.read('var(--cabinet-shadow, oklch(26.5% 0.08 289))')

  scene.add(
    buildAlcoveStage(SHIPPED_ALCOVE, {
      color: shadowTint,
      floorOpacity: 0.5,
      wallOpacity: 0.16
    }),
    new HemisphereLight('#ffffff', '#404040', 0.95),
    new AmbientLight('#ffffff', 0.1)
  )
  // From the players' side, above and to the left: it models the chrome and the fur.
  const key = new DirectionalLight('#ffffff', 1.6)
  key.position.set(-1, 3.2, 3)
  // Straight down, so every claw's shadow lands right under it on the pile: the aim reads off the shadow.
  const overhead = new DirectionalLight('#ffffff', 1.1)
  overhead.position.set(0, 7, -SHIPPED_ALCOVE.depth / 2)
  overhead.target.position.set(0, 0, -SHIPPED_ALCOVE.depth / 2)
  overhead.castShadow = true
  overhead.shadow.mapSize.set(2048, 2048)
  overhead.shadow.bias = -0.0006
  Object.assign(overhead.shadow.camera, {
    bottom: -0.8,
    far: 8,
    left: -0.7,
    near: 4,
    right: 0.7,
    top: 0.8
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

  const metal = new MeshPhysicalMaterial({
    color: chrome,
    metalness: 1,
    roughness: 0.18
  })
  const railPaint = new MeshStandardMaterial({
    color: candy,
    metalness: 0.35,
    roughness: 0.4
  })
  const cablePaint = new MeshStandardMaterial({
    color: '#9aa0aa',
    roughness: 0.6
  })

  // The rails flat against the real roof, inside the walls and the opening.
  const { rail } = pit
  for (const side of [-1, 1]) {
    const beam = new Mesh(
      new BoxGeometry(RAIL_SIZE, RAIL_SIZE, rail.front - rail.back),
      railPaint
    )
    beam.position.set(
      side * (rail.halfX - RAIL_SIZE / 2),
      rail.y,
      (rail.front + rail.back) / 2
    )
    scene.add(beam)
  }

  const chutePaint = new MeshStandardMaterial({
    color: chrome,
    metalness: 0.3,
    roughness: 0.45
  })
  const chuteLip = new MeshStandardMaterial({
    color: '#2a2a2a',
    roughness: 0.6
  })
  for (const chute of pit.chutes) {
    scene.add(
      buildChute(chute.x, chute.z, { lip: chuteLip, paint: chutePaint })
    )
  }

  const furs = FUR.map((hex) => furMaterial(new Color(hex)))
  const muzzle = furMaterial(new Color('#efe3cf'))
  const eye = new MeshStandardMaterial({ color: '#1a1410', roughness: 0.3 })
  const clear = new MeshPhysicalMaterial({
    clearcoat: 1,
    color: '#ffffff',
    depthWrite: false,
    opacity: 0.35,
    roughness: 0.05,
    transparent: true
  })
  const shells = [candy, cyan, lemon]
    .slice(0, PRIZE_TINTS.capsule)
    .map(
      (color) =>
        new MeshPhysicalMaterial({ clearcoat: 1, color, roughness: 0.25 })
    )

  const prizeModel = (prize: Prize): Group =>
    prize.kind === 'capsule'
      ? buildCapsule({ clear, shell: shells[prize.tint] ?? clear })
      : buildPlush(prize.kind, {
          eye,
          fur: furs[prize.tint] ?? muzzle,
          muzzle
        })

  const lacquers = Array.from(
    { length: ROOM_SEAT_LIMIT },
    (_, slot) =>
      new MeshPhysicalMaterial({
        clearcoat: 1,
        clearcoatRoughness: 0.12,
        color: colors.readSeat(slot),
        roughness: 0.35
      })
  )
  const rings = Array.from(
    { length: ROOM_SEAT_LIMIT },
    (_, slot) =>
      new MeshStandardMaterial({
        color: colors.readSeat(slot, '--seat-cap'),
        roughness: 0.5
      })
  )
  const unpainted = new MeshPhysicalMaterial({ color: chrome, roughness: 0.3 })

  const confetti = buildConfetti({
    bounds: {
      back: rail.back,
      front: pit.reach.maxZ + CLAW_REACH,
      halfX: rail.halfX,
      roof: rail.y - RAIL_SIZE / 2
    },
    palette: [candy, cyan, lemon, chrome],
    random: Math.random
  })
  scene.add(confetti.group)

  const shownPrizes = new Map<number, Group>()
  /** The prizes last drawn: one gone from the view sank in a chute. */
  const drawnPrizes = new Map<number, Prize>()
  const rigs = new Map<SeatId, ClawRig>()

  const rigOf = (seat: SeatId, slot: SeatSlot | undefined): ClawRig => {
    const existing = rigs.get(seat)
    if (existing !== undefined && existing.slot === slot) return existing
    if (existing !== undefined) dropRig(seat, existing)
    const model = buildClaw({
      cable: cablePaint,
      lacquer: slot === undefined ? unpainted : (lacquers[slot] ?? unpainted),
      metal,
      ring: slot === undefined ? metal : (rings[slot] ?? metal)
    })
    const bar = new Mesh(
      new BoxGeometry(
        (rail.halfX - RAIL_SIZE) * 2,
        RAIL_SIZE * 0.7,
        RAIL_SIZE * 0.7
      ),
      railPaint
    )
    const carriage = new Mesh(
      new BoxGeometry(0.05, RAIL_SIZE * 1.3, 0.045),
      railPaint
    )
    scene.add(model.group, model.cable, bar, carriage)
    const rig = { bar, carriage, model, slot }
    rigs.set(seat, rig)
    return rig
  }

  const dropRig = (seat: SeatId, rig: ClawRig) => {
    for (const part of [
      rig.model.group,
      rig.model.cable,
      rig.bar,
      rig.carriage
    ]) {
      part.removeFromParent()
    }
    rig.bar.geometry.dispose()
    rig.carriage.geometry.dispose()
    rig.model.cable.geometry.dispose()
    rig.model.group.traverse((node) => {
      if (node instanceof Mesh) node.geometry.dispose()
    })
    rigs.delete(seat)
  }

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

  return {
    dispose: () => {
      resizing.disconnect()
      for (const [seat, rig] of rigs) dropRig(seat, rig)
      for (const group of shownPrizes.values()) group.removeFromParent()
      shownPrizes.clear()
      drawnPrizes.clear()
      confetti.dispose()
      disposeTree(scene)
      for (const material of [
        metal,
        railPaint,
        cablePaint,
        chutePaint,
        chuteLip,
        muzzle,
        eye,
        clear,
        unpainted,
        ...furs,
        ...shells,
        ...lacquers,
        ...rings
      ]) {
        material.dispose()
      }
      disposeSharedGeometries()
      reflections.dispose()
      renderer.dispose()
      renderer.domElement.remove()
      colors.dispose()
    },
    draw: ({ slotOf, view }, seconds) => {
      const seen = new Set<number>()
      for (const prize of view.prizes) {
        seen.add(prize.id)
        let group = shownPrizes.get(prize.id)
        if (group === undefined) {
          group = prizeModel(prize)
          group.rotation.set(0, prize.yaw, 0)
          shownPrizes.set(prize.id, group)
          scene.add(group)
        }
        group.position.set(prize.x, prize.y, prize.z)
        const grown = Math.min(1, prize.age / GROW_SECONDS)
        group.scale.setScalar(Math.max(0.001, 1 - (1 - grown) ** 3))
        if (prize.state === 'falling') {
          group.rotation.x += seconds * 3
        } else {
          group.rotation.x = 0
        }
      }
      for (const [id, group] of shownPrizes) {
        if (!seen.has(id)) {
          group.removeFromParent()
          shownPrizes.delete(id)
        }
      }
      const { lastCatch } = view
      const scorer =
        lastCatch !== null && view.elapsed - lastCatch.at < CATCH_COLOUR_SECONDS
          ? slotOf(lastCatch.seat)
          : undefined
      for (const [id, prize] of drawnPrizes) {
        if (seen.has(id)) continue
        drawnPrizes.delete(id)
        if (!prize.intoChute) continue
        confetti.launch({
          count: CONFETTI[prize.kind === 'capsule' ? 'capsule' : 'plush'],
          seat: scorer === undefined ? null : colors.readSeat(scorer),
          x: prize.x,
          y: CHUTE_SIZE.height,
          z: prize.z
        })
      }
      for (const prize of view.prizes) drawnPrizes.set(prize.id, prize)
      confetti.step(seconds)

      const anchors = new Map<SeatId, { x: number; y: number }>()
      const playing = new Set<SeatId>()
      for (const claw of view.claws) {
        playing.add(claw.seat)
        const rig = rigOf(claw.seat, slotOf(claw.seat))
        rig.model.group.position.set(claw.x, claw.y, claw.z)
        rig.model.setOpen(claw.open)
        rig.model.setCable(claw.x, claw.z, claw.y + CLAW_CROWN, rail.y)
        rig.bar.position.set(0, rail.y - RAIL_SIZE * 0.15, claw.z)
        rig.carriage.position.set(claw.x, rail.y - RAIL_SIZE * 0.3, claw.z)
        anchors.set(claw.seat, toCanvas(claw.x, claw.y + 0.11, claw.z))
      }
      for (const [seat, rig] of rigs) {
        if (!playing.has(seat)) dropRig(seat, rig)
      }

      renderer.render(scene, camera)
      return anchors
    }
  }
}
