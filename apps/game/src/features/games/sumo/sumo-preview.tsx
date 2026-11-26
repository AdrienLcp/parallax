import type React from 'react'
import { useLayoutEffect, useRef, useState } from 'react'

import { useDisplayTuning } from '@/features/display-tuning/display-tuning-store'
import type { GamePreviewProps } from '@/features/games/game-definition'

import {
  type ArenaFraming,
  frameTheTable,
  projectOnCanvas,
  type TablePoint
} from './arena-camera'
import { ARENA_PLAN, FILET_WIDTHS } from './arena-plan'
import { SHIPPED_HEIGHTS } from './arena-shape'
import { ARENA_TABLE } from './arena-table'
import { columnProfile } from './column-model'
import { PreviewTops } from './preview-tops'

import './sumo-preview.sass'

const OUTLINE_STEPS = 160

type Ring = { readonly radius: number; readonly y: number }

const pointsOn = (
  { radius, y }: Ring,
  { from, to }: { from: number; to: number }
) =>
  Array.from({ length: OUTLINE_STEPS + 1 }, (_, step) => {
    const angle = from + ((to - from) * step) / OUTLINE_STEPS
    return {
      point: { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius },
      y
    }
  })

const WHOLE_TURN = { from: 0, to: 2 * Math.PI }
const NEAR_HALF = { from: 0, to: Math.PI }
const NEAR_HALF_BACK = { from: Math.PI, to: 0 }
const FAR_HALF = { from: Math.PI, to: 2 * Math.PI }

const pathThrough = (
  framing: ArenaFraming,
  points: readonly { point: TablePoint; y: number }[]
) =>
  `${points
    .map(({ point, y: height }, index) => {
      const { x, y } = projectOnCanvas(framing, point, height)
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join('')}Z`

const discPath = (framing: ArenaFraming, ring: Ring) =>
  pathThrough(framing, pointsOn(ring, WHOLE_TURN))

const filetPath = (
  framing: ArenaFraming,
  { radius, width, y }: { radius: number; width: number; y: number }
) =>
  discPath(framing, { radius: radius + width / 2, y }) +
  discPath(framing, { radius: radius - width / 2, y })

/** The near half of a standing band of the drum, between two heights. */
const bandPath = (
  framing: ArenaFraming,
  { bottom, radius, top }: { bottom: number; radius: number; top: number }
) =>
  pathThrough(framing, [
    ...pointsOn({ radius, y: top }, NEAR_HALF),
    ...pointsOn({ radius, y: bottom }, NEAR_HALF_BACK)
  ])

const FELT = SHIPPED_HEIGHTS.surfaceHeight
const UNDERSIDE = ARENA_TABLE.rise
/** Where the slab's walnut underside narrows to the column's capital, as `table-model.ts` turns it. */
const SLAB_FOOT_RADIUS = 0.2

/** The slab's walnut side as the room sees it: the edge's far half over the underside's near half. */
const slabPath = (framing: ArenaFraming) =>
  pathThrough(framing, [
    ...pointsOn(
      { radius: ARENA_TABLE.edgeRadius, y: FELT - ARENA_TABLE.bandHeight },
      FAR_HALF
    ),
    ...pointsOn({ radius: SLAB_FOOT_RADIUS, y: UNDERSIDE }, NEAR_HALF)
  ])

/** The column's silhouette, its profile mirrored across the axis on the table's plane. */
const columnPath = (framing: ArenaFraming) => {
  const profile = columnProfile(UNDERSIDE)
  return pathThrough(framing, [
    ...profile.map(([radius, y]) => ({ point: { x: radius, z: 0 }, y })),
    ...profile
      .toReversed()
      .map(([radius, y]) => ({ point: { x: -radius, z: 0 }, y }))
  ])
}

/** The column's round foot, seen on the floor. */
const footPath = (framing: ArenaFraming) =>
  discPath(framing, { radius: columnProfile(UNDERSIDE)[1]?.[0] ?? 0, y: 0 })

const tickSquareOf = (tick: number) => {
  const angle = (tick * 2 * Math.PI) / ARENA_PLAN.ticks
  const centre = {
    x: Math.cos(angle) * ARENA_PLAN.tickRadius,
    z: Math.sin(angle) * ARENA_PLAN.tickRadius
  }
  const half = ARENA_PLAN.tickSize / 2
  return [
    [-half, -half],
    [half, -half],
    [half, half],
    [-half, half]
  ].map(([across = 0, along = 0]) => ({
    point: {
      x: centre.x + across * Math.cos(angle) - along * Math.sin(angle),
      z: centre.z + across * Math.sin(angle) + along * Math.cos(angle)
    },
    y: FELT
  }))
}

const MARKINGS = [
  { className: 'rim', name: 'rim' },
  { className: 'centre-ring', name: 'centreRing' },
  { className: 'centre-spot', name: 'centreSpot' }
] as const

const TICKS = Array.from({ length: ARENA_PLAN.ticks }, (_, tick) => ({
  square: tickSquareOf(tick),
  tick
}))

const TableDrawing: React.FC<{
  framing: ArenaFraming
  isShowcase: boolean
}> = ({ framing, isShowcase }) => (
  <svg aria-hidden='true' viewBox={`0 0 ${framing.width} ${framing.height}`}>
    <path className='column' d={footPath(framing)} />
    <path className='column' d={columnPath(framing)} />
    <path className='slab' d={slabPath(framing)} />
    <path
      className='table-band'
      d={bandPath(framing, {
        bottom: FELT - ARENA_TABLE.bandHeight,
        radius: ARENA_TABLE.edgeRadius,
        top: FELT
      })}
    />
    <path
      className='platform'
      d={discPath(framing, { radius: ARENA_TABLE.edgeRadius, y: FELT })}
    />
    {MARKINGS.map(({ className, name }) => (
      <path
        className={`filet ${className}`}
        d={filetPath(framing, {
          radius: ARENA_PLAN[name],
          width: FILET_WIDTHS[name],
          y: FELT
        })}
        key={name}
      />
    ))}
    {TICKS.map(({ square, tick }) => (
      <path className='tick' d={pathThrough(framing, square)} key={tick} />
    ))}
    {isShowcase && <PreviewTops framing={framing} />}
  </svg>
)

/**
 * The sumo's arena before its scene exists: the table on its column, its
 * felt, filets and ticks drawn flat through the very camera the scene frames the
 * table with, sized to its host, so the scene appears over it without a jump. Standing in for the showcase,
 * it also draws the demo tops on the marks the showcase starts from.
 */
export const SumoPreview: React.FC<GamePreviewProps> = ({
  isShowcase = false
}) => {
  const host = useRef<HTMLDivElement>(null)
  const [framing, setFraming] = useState<ArenaFraming | null>(null)
  const { lens } = useDisplayTuning().arena

  useLayoutEffect(() => {
    const element = host.current
    if (element === null) {
      return
    }

    const fitToHost = () => {
      const { clientHeight: height, clientWidth: width } = element
      setFraming(
        width === 0 || height === 0
          ? null
          : frameTheTable({ height, width }, lens)
      )
    }
    const resizing = new ResizeObserver(fitToHost)
    resizing.observe(element)
    fitToHost()

    return () => resizing.disconnect()
  }, [lens])

  return (
    <div className='sumo-preview' ref={host}>
      {framing !== null && (
        <TableDrawing framing={framing} isShowcase={isShowcase} />
      )}
    </div>
  )
}
