import type React from 'react'
import { useLayoutEffect, useRef, useState } from 'react'

import {
  ARENA_PLAN,
  type ArenaFraming,
  FILET_WIDTHS,
  frameTheTable,
  projectOnCanvas,
  type TablePoint
} from './arena-camera'
import { SUMO_TUNING } from './sumo-tuning'

import './sumo-preview.sass'

const OUTLINE_STEPS = 160

const pathThrough = (framing: ArenaFraming, points: readonly TablePoint[]) =>
  `${points
    .map((point, index) => {
      const { x, y } = projectOnCanvas(framing, point)
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join('')}Z`

const circleOf = (radius: number): TablePoint[] =>
  Array.from({ length: OUTLINE_STEPS }, (_, step) => {
    const angle = (step * 2 * Math.PI) / OUTLINE_STEPS
    return { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius }
  })

const discPath = (framing: ArenaFraming, radius: number) =>
  pathThrough(framing, circleOf(radius))

const filetPath = (
  framing: ArenaFraming,
  { radius, width }: { radius: number; width: number }
) =>
  discPath(framing, radius + width / 2) + discPath(framing, radius - width / 2)

const tickSquareOf = (tick: number): TablePoint[] => {
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
    x: centre.x + across * Math.cos(angle) - along * Math.sin(angle),
    z: centre.z + across * Math.sin(angle) + along * Math.cos(angle)
  }))
}

const FILETS = [
  { className: 'rim', name: 'rim' },
  { className: 'gutter-edge', name: 'gutterEdge' },
  { className: 'centre-ring', name: 'centreRing' },
  { className: 'centre-spot', name: 'centreSpot' }
] as const

const TICKS = Array.from({ length: ARENA_PLAN.ticks }, (_, tick) => ({
  square: tickSquareOf(tick),
  tick
}))

const ArenaPlanDrawing: React.FC<{ framing: ArenaFraming }> = ({ framing }) => (
  <svg aria-hidden='true' viewBox={`0 0 ${framing.width} ${framing.height}`}>
    <path className='gutter' d={discPath(framing, ARENA_PLAN.gutter)} />
    <path className='platform' d={discPath(framing, SUMO_TUNING.arenaRadius)} />
    {FILETS.map(({ className, name }) => (
      <path
        className={`filet ${className}`}
        d={filetPath(framing, {
          radius: ARENA_PLAN[name],
          width: FILET_WIDTHS[name]
        })}
        key={name}
      />
    ))}
    {TICKS.map(({ square, tick }) => (
      <path className='tick' d={pathThrough(framing, square)} key={tick} />
    ))}
  </svg>
)

/**
 * The sumo's arena before its scene exists: the felt, filets and ticks drawn
 * through the very camera the scene frames the table with, sized to its host,
 * so the scene appears over it without a jump.
 */
export const SumoPreview: React.FC = () => {
  const host = useRef<HTMLDivElement>(null)
  const [framing, setFraming] = useState<ArenaFraming | null>(null)

  useLayoutEffect(() => {
    const element = host.current
    if (element === null) {
      return
    }

    const fitToHost = () => {
      const { clientHeight: height, clientWidth: width } = element
      setFraming(
        width === 0 || height === 0 ? null : frameTheTable({ height, width })
      )
    }
    const resizing = new ResizeObserver(fitToHost)
    resizing.observe(element)
    fitToHost()

    return () => resizing.disconnect()
  }, [])

  return (
    <div className='sumo-preview' ref={host}>
      {framing !== null && <ArenaPlanDrawing framing={framing} />}
    </div>
  )
}
