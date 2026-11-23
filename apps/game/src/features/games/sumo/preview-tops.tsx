import type React from 'react'

import type { SeatSlot } from '@parallax/protocol/room'

import { SEAT_GLYPHS } from '@/features/room/seat-top'

import {
  type ArenaFraming,
  projectOnCanvas,
  type TablePoint,
  TOP_HEIGHT
} from './arena-camera'
import { roundMarksOf } from './round-marks'
import { SHOWCASE_SLOTS } from './showcase-slots'
import { SUMO_TUNING } from './sumo-tuning'

const TOP_RADIUS = SUMO_TUNING.topRadius

/** The heights and radii the scene's top model is built from, in arena units. */
const TOP_MODEL = {
  capHeight: TOP_HEIGHT,
  capRadius: (30 / 46) * TOP_RADIUS,
  ringHeight: 0.8 * TOP_HEIGHT,
  ringWidth: 0.04 * TOP_RADIUS
} as const

/**
 * How far a top's shadow slides on the felt per unit of height, away from the
 * scene's key light, and the height its body casts from on average.
 */
const SHADOW = {
  castHeight: 0.6 * TOP_HEIGHT,
  perHeight: { x: 0.7 / 3, z: -1.1 / 3 },
  radius: 0.9 * TOP_RADIUS
} as const

/** The showcase's demo tops on their marks, where its first round starts. */
const MARKED_TOPS = roundMarksOf(SHOWCASE_SLOTS.length).map(
  (position, index) => ({
    mark: { x: position.x, z: position.y },
    slot: SHOWCASE_SLOTS[index] ?? 0
  })
)

type CanvasDisc = { cx: number; cy: number; rx: number; ry: number }

const discOnCanvas = (
  framing: ArenaFraming,
  {
    centre,
    height,
    radius
  }: { centre: TablePoint; height: number; radius: number }
): CanvasDisc => {
  const { x: cx, y: cy } = projectOnCanvas(framing, centre, height)
  const right = projectOnCanvas(
    framing,
    { ...centre, x: centre.x + radius },
    height
  )
  const near = projectOnCanvas(
    framing,
    { ...centre, z: centre.z + radius },
    height
  )
  const far = projectOnCanvas(
    framing,
    { ...centre, z: centre.z - radius },
    height
  )
  return { cx, cy, rx: right.x - cx, ry: (near.y - far.y) / 2 }
}

const PreviewTop: React.FC<{
  framing: ArenaFraming
  mark: TablePoint
  slot: SeatSlot
}> = ({ framing, mark, slot }) => {
  const shadow = discOnCanvas(framing, {
    centre: {
      x: mark.x + SHADOW.perHeight.x * SHADOW.castHeight,
      z: mark.z + SHADOW.perHeight.z * SHADOW.castHeight
    },
    height: 0,
    radius: SHADOW.radius
  })
  const body = discOnCanvas(framing, {
    centre: mark,
    height: TOP_MODEL.ringHeight,
    radius: TOP_RADIUS
  })
  const ring = discOnCanvas(framing, {
    centre: mark,
    height: TOP_MODEL.ringHeight,
    radius: TOP_RADIUS - TOP_MODEL.ringWidth / 2
  })
  const cap = discOnCanvas(framing, {
    centre: mark,
    height: TOP_MODEL.capHeight,
    radius: TOP_MODEL.capRadius
  })

  return (
    <g data-seat-slot={slot}>
      <ellipse className='top-shadow' {...shadow} />
      <ellipse className='lacquer' {...body} />
      <ellipse
        className='ring'
        {...ring}
        strokeWidth={(TOP_MODEL.ringWidth / TOP_RADIUS) * body.rx}
      />
      <g
        transform={`translate(${cap.cx} ${cap.cy}) scale(${cap.rx / 30} ${cap.ry / 30}) translate(-50 -50)`}
      >
        <circle className='cap' cx='50' cy='50' r='30' />
        <g className='glyph' transform='translate(32 32) scale(0.36)'>
          {SEAT_GLYPHS[slot]}
        </g>
      </g>
    </g>
  )
}

/**
 * The showcase's demo tops standing on their marks, drawn flat through the
 * scene's camera: what the game choice shows until the showcase takes over,
 * which starts its first round from these very marks.
 */
export const PreviewTops: React.FC<{ framing: ArenaFraming }> = ({
  framing
}) => (
  <g className='preview-tops'>
    {MARKED_TOPS.map(({ mark, slot }) => (
      <PreviewTop framing={framing} key={slot} mark={mark} slot={slot} />
    ))}
  </g>
)
