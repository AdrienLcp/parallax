import type React from 'react'
import { useLayoutEffect, useRef, useState } from 'react'

import type { GamePreviewProps } from '@/features/games/game-definition'

import {
  type ArenaFraming,
  frameTheTable,
  projectOnCanvas,
  type TablePoint
} from './arena-camera'
import { ARENA_DRUM, DITCH_FLOOR, DRUM_LIP_TOP } from './arena-drum'
import { ARENA_PLAN, FILET_WIDTHS } from './arena-plan'
import { PreviewTops } from './preview-tops'
import { SUMO_TUNING } from './sumo-tuning'

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

/** The drum's walnut side as the room sees it: the lip's far half over the foot's near half. */
const sidePath = (framing: ArenaFraming) =>
  pathThrough(framing, [
    ...pointsOn(
      { radius: ARENA_DRUM.lipOuterRadius, y: DRUM_LIP_TOP },
      FAR_HALF
    ),
    ...pointsOn({ radius: ARENA_DRUM.baseRadius, y: 0 }, NEAR_HALF)
  ])

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
    y: ARENA_DRUM.surfaceHeight
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

const HOLE_ID = 'sumo-preview-hole'

const DrumDrawing: React.FC<{
  framing: ArenaFraming
  isShowcase: boolean
}> = ({ framing, isShowcase }) => {
  const hole = discPath(framing, {
    radius: ARENA_DRUM.lipInnerRadius,
    y: DRUM_LIP_TOP
  })
  return (
    <svg aria-hidden='true' viewBox={`0 0 ${framing.width} ${framing.height}`}>
      <clipPath id={HOLE_ID}>
        <path d={hole} />
      </clipPath>
      <path className='drum-side' d={sidePath(framing)} />
      <path
        className='drum-band'
        d={bandPath(framing, {
          bottom: DRUM_LIP_TOP - ARENA_DRUM.bandHeight,
          radius: ARENA_DRUM.lipOuterRadius,
          top: DRUM_LIP_TOP
        })}
      />
      <path
        className='drum-lip'
        d={discPath(framing, {
          radius: ARENA_DRUM.lipOuterRadius,
          y: DRUM_LIP_TOP
        })}
      />
      <path className='ditch-wall' d={hole} />
      <g clipPath={`url(#${HOLE_ID})`}>
        <path
          className='ditch'
          d={discPath(framing, {
            radius: ARENA_DRUM.lipInnerRadius,
            y: DITCH_FLOOR
          })}
        />
        <path
          className='ditch'
          d={bandPath(framing, {
            bottom: DITCH_FLOOR,
            radius: SUMO_TUNING.arenaRadius,
            top: ARENA_DRUM.surfaceHeight
          })}
        />
        <path
          className='platform'
          d={discPath(framing, {
            radius: SUMO_TUNING.arenaRadius,
            y: ARENA_DRUM.surfaceHeight
          })}
        />
      </g>
      {MARKINGS.map(({ className, name }) => (
        <path
          className={`filet ${className}`}
          d={filetPath(framing, {
            radius: ARENA_PLAN[name],
            width: FILET_WIDTHS[name],
            y: ARENA_DRUM.surfaceHeight
          })}
          key={name}
        />
      ))}
      {TICKS.map(({ square, tick }) => (
        <path className='tick' d={pathThrough(framing, square)} key={tick} />
      ))}
      <path
        className='filet'
        d={filetPath(framing, {
          radius: ARENA_DRUM.lipInnerRadius + ARENA_DRUM.lipFiletWidth / 2,
          width: ARENA_DRUM.lipFiletWidth,
          y: DRUM_LIP_TOP
        })}
      />
      {isShowcase && <PreviewTops framing={framing} />}
    </svg>
  )
}

/**
 * The sumo's arena before its scene exists: the walnut drum, its felt, ditch,
 * filets and ticks drawn flat through the very camera the scene frames the
 * drum with, sized to its host, so the scene appears over it without a jump. Standing in for the showcase,
 * it also draws the demo tops on the marks the showcase starts from.
 */
export const SumoPreview: React.FC<GamePreviewProps> = ({
  isShowcase = false
}) => {
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
      {framing !== null && (
        <DrumDrawing framing={framing} isShowcase={isShowcase} />
      )}
    </div>
  )
}
