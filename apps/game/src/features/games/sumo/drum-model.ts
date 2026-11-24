import {
  type BufferGeometry,
  CircleGeometry,
  type Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  LatheGeometry,
  type Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RingGeometry,
  ShadowMaterial,
  Vector2
} from 'three'

import { ARENA_DRUM, DITCH_FLOOR, DRUM_LIP_TOP } from './arena-drum'
import { ARENA_PLAN, FILET_WIDTHS } from './arena-plan'
import { SHIPPED_LIGHTING } from './arena-tuning'
import { laidFlat } from './laid-flat'
import { SUMO_TUNING } from './sumo-tuning'

const ROUND_SEGMENTS = 200
/** A filet's lift over the surface it is drawn on, enough to win the depth test. */
const FILET_LIFT = 0.0004
const CATCHER_LIFT = 0.0006

type ReadColor = (cssColor: string) => Color

const filet = ({
  color,
  opacity = 1,
  radius,
  width,
  y
}: {
  color: Color
  opacity?: number
  radius: number
  width: number
  y: number
}): Mesh =>
  laidFlat(
    new Mesh(
      new RingGeometry(radius - width / 2, radius + width / 2, ROUND_SEGMENTS),
      new MeshBasicMaterial({
        color,
        depthWrite: false,
        opacity,
        transparent: opacity < 1
      })
    ),
    y
  )

const shadowCatcher = (
  geometry: BufferGeometry,
  y: number,
  ink: Color
): Mesh => {
  const catcher = laidFlat(
    new Mesh(
      geometry,
      new ShadowMaterial({
        color: ink,
        depthWrite: false,
        opacity: SHIPPED_LIGHTING.shadowOpacity
      })
    ),
    y + CATCHER_LIFT
  )
  catcher.receiveShadow = true
  catcher.renderOrder = 5
  return catcher
}

/** The plan's markings on the felt: rim, centre ring, centre spot and ticks, in unlit brass. */
const buildMarkings = (brass: Color): Group => {
  const y = ARENA_DRUM.surfaceHeight + FILET_LIFT
  const markings = new Group()
  markings.add(
    filet({
      color: brass,
      radius: ARENA_PLAN.rim,
      width: FILET_WIDTHS.rim,
      y
    }),
    filet({
      color: brass,
      opacity: 0.4,
      radius: ARENA_PLAN.centreRing,
      width: FILET_WIDTHS.centreRing,
      y
    }),
    filet({
      color: brass,
      radius: ARENA_PLAN.centreSpot,
      width: FILET_WIDTHS.centreSpot,
      y
    })
  )
  const tickMaterial = new MeshBasicMaterial({
    color: brass,
    depthWrite: false,
    opacity: 0.7,
    transparent: true
  })
  for (let tick = 0; tick < ARENA_PLAN.ticks; tick++) {
    const angle = (tick * 2 * Math.PI) / ARENA_PLAN.ticks
    const square = laidFlat(
      new Mesh(
        new PlaneGeometry(ARENA_PLAN.tickSize, ARENA_PLAN.tickSize),
        tickMaterial
      ),
      y
    )
    square.position.x = Math.cos(angle) * ARENA_PLAN.tickRadius
    square.position.z = Math.sin(angle) * ARENA_PLAN.tickRadius
    square.rotation.z = -angle
    markings.add(square)
  }
  return markings
}

const lit = (color: Color, extra: { side?: typeof DoubleSide } = {}) =>
  new MeshStandardMaterial({ color, metalness: 0, roughness: 0.62, ...extra })

const openCylinder = ({
  height,
  material,
  radius,
  y
}: {
  height: number
  material: Material
  radius: number
  y: number
}): Mesh => {
  const cylinder = new Mesh(
    new CylinderGeometry(radius, radius, height, ROUND_SEGMENTS, 1, true),
    material
  )
  cylinder.position.y = y
  return cylinder
}

/**
 * The arena as an object on the alcove's floor: a low walnut drum whose felt
 * platform is raised inside a ditch, ringed by a walnut lip with a brass filet
 * and a brass band. The felt and its markings stay unlit, as the plan draws
 * them; the wood and brass take the light, and catchers lay the tops' and the
 * drum's soft shadows on the felt, in the ditch and on the floor.
 */
export const buildDrum = (read: ReadColor): Group => {
  const brass = read('var(--brass)')
  const ink = read('var(--lacquer-ink)')
  const walnut = read('var(--walnut)')
  const walnutDark = read(
    'color-mix(in oklab, var(--walnut) 70%, var(--lacquer-ink))'
  )
  const feltDeep = read('var(--felt-deep)')
  const { arenaRadius } = SUMO_TUNING
  const {
    baseRadius,
    bandHeight,
    ditchDepth,
    lipFiletWidth,
    lipHeight,
    lipInnerRadius,
    lipOuterRadius,
    surfaceHeight
  } = ARENA_DRUM

  const platform = laidFlat(
    new Mesh(
      new CircleGeometry(arenaRadius, ROUND_SEGMENTS),
      new MeshBasicMaterial({
        color: read('color-mix(in oklab, var(--felt) 94%, var(--chalk))')
      })
    ),
    surfaceHeight
  )

  const ditchFloor = laidFlat(
    new Mesh(
      new RingGeometry(arenaRadius, lipInnerRadius, ROUND_SEGMENTS),
      new MeshBasicMaterial({ color: feltDeep })
    ),
    DITCH_FLOOR
  )
  const innerWall = openCylinder({
    height: ditchDepth,
    material: lit(feltDeep, { side: DoubleSide }),
    radius: arenaRadius,
    y: surfaceHeight - ditchDepth / 2
  })
  innerWall.receiveShadow = true
  const outerWall = openCylinder({
    height: ditchDepth + lipHeight,
    material: lit(walnutDark, { side: DoubleSide }),
    radius: lipInnerRadius,
    y: DITCH_FLOOR + (ditchDepth + lipHeight) / 2
  })
  outerWall.receiveShadow = true

  const lipTop = laidFlat(
    new Mesh(
      new RingGeometry(lipInnerRadius, lipOuterRadius, ROUND_SEGMENTS),
      lit(walnut)
    ),
    DRUM_LIP_TOP
  )
  lipTop.castShadow = true
  lipTop.receiveShadow = true

  const band = openCylinder({
    height: bandHeight,
    material: new MeshStandardMaterial({
      color: brass,
      metalness: 0.85,
      roughness: 0.3
    }),
    radius: lipOuterRadius + 0.004,
    y: DRUM_LIP_TOP - bandHeight / 2
  })
  band.castShadow = true

  const sideProfile = [
    [baseRadius, 0],
    [baseRadius, 0.025],
    [lipOuterRadius + 0.012, 0.04],
    [lipOuterRadius, 0.05],
    [lipOuterRadius, DRUM_LIP_TOP - bandHeight]
  ].map(([x = 0, y = 0]) => new Vector2(x, y))
  const side = new Mesh(
    new LatheGeometry(sideProfile, ROUND_SEGMENTS),
    lit(walnut)
  )
  side.castShadow = true
  side.receiveShadow = true

  const shadowCaster = laidFlat(
    new Mesh(
      new CircleGeometry(lipOuterRadius, 96),
      new MeshBasicMaterial({ colorWrite: false, depthWrite: false })
    ),
    surfaceHeight / 2
  )
  shadowCaster.castShadow = true

  const drum = new Group()
  drum.add(
    platform,
    buildMarkings(brass),
    ditchFloor,
    innerWall,
    outerWall,
    lipTop,
    filet({
      color: brass,
      radius: lipInnerRadius + lipFiletWidth / 2,
      width: lipFiletWidth,
      y: DRUM_LIP_TOP + FILET_LIFT
    }),
    band,
    side,
    shadowCaster,
    shadowCatcher(
      new CircleGeometry(arenaRadius, ROUND_SEGMENTS),
      surfaceHeight,
      ink
    ),
    shadowCatcher(
      new RingGeometry(arenaRadius, lipInnerRadius, ROUND_SEGMENTS),
      DITCH_FLOOR,
      ink
    ),
    shadowCatcher(new PlaneGeometry(9, 9), 0, ink)
  )
  return drum
}
