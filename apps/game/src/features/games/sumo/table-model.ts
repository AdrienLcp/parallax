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

import { ARENA_PLAN, FILET_WIDTHS } from './arena-plan'
import { ARENA_TABLE } from './arena-table'
import { SHIPPED_LIGHTING } from './arena-tuning'
import { laidFlat } from './laid-flat'

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
  const y = ARENA_TABLE.thickness + FILET_LIFT
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

/** Where the slab's walnut underside narrows to the column's capital. */
export const SLAB_FOOT_RADIUS = 0.2

/**
 * The arena's guéridon top, its underside at its origin: felt running out to
 * a brass edge with no lip, over a walnut slab that narrows to the column's
 * capital. The felt and its markings stay unlit, as the plan draws them; the
 * wood and brass take the light, and a catcher lays the tops' soft shadows on
 * the felt. The column and the floor are the renderer's.
 */
export const buildTable = (read: ReadColor): Group => {
  const brass = read('var(--brass)')
  const ink = read('var(--lacquer-ink)')
  const walnut = read('var(--walnut)')
  const walnutDark = read(
    'color-mix(in oklab, var(--walnut) 70%, var(--lacquer-ink))'
  )
  const { bandHeight, edgeRadius, thickness } = ARENA_TABLE

  const felt = laidFlat(
    new Mesh(
      new CircleGeometry(edgeRadius, ROUND_SEGMENTS),
      new MeshBasicMaterial({
        color: read('color-mix(in oklab, var(--felt) 94%, var(--chalk))')
      })
    ),
    thickness
  )

  const edge = openCylinder({
    height: bandHeight,
    material: new MeshStandardMaterial({
      color: brass,
      metalness: 0.85,
      roughness: 0.3
    }),
    radius: edgeRadius + 0.004,
    y: thickness - bandHeight / 2
  })
  edge.castShadow = true

  const slabProfile = [
    [SLAB_FOOT_RADIUS, 0],
    [0.3, 0.02],
    [edgeRadius - 0.05, thickness - 0.11],
    [edgeRadius, thickness - 0.085],
    [edgeRadius, thickness - bandHeight]
  ].map(([x = 0, y = 0]) => new Vector2(x, y))
  const slab = new Mesh(
    new LatheGeometry(slabProfile, ROUND_SEGMENTS),
    lit(walnut)
  )
  slab.castShadow = true
  slab.receiveShadow = true

  const underside = laidFlat(
    new Mesh(
      new CircleGeometry(SLAB_FOOT_RADIUS, 48),
      lit(walnutDark, { side: DoubleSide })
    ),
    0
  )

  /** A flat disc only casts from its back face: both sides, or the slab casts a ring. */
  const shadowCaster = laidFlat(
    new Mesh(
      new CircleGeometry(edgeRadius, 96),
      new MeshBasicMaterial({
        colorWrite: false,
        depthWrite: false,
        side: DoubleSide
      })
    ),
    thickness / 2
  )
  shadowCaster.castShadow = true

  const table = new Group()
  table.add(
    felt,
    buildMarkings(brass),
    edge,
    slab,
    underside,
    shadowCaster,
    shadowCatcher(
      new CircleGeometry(edgeRadius, ROUND_SEGMENTS),
      thickness,
      ink
    )
  )
  return table
}
