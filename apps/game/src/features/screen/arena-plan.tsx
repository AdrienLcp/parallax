import type React from 'react'

import { ROOM_SEAT_LIMIT } from '@parallax/protocol/room'

import './arena-plan.sass'

const TICK_COUNT = 8
const TICK_RADIUS = 0.5
const HOME_SPOT_RADIUS = 0.56
const FIRST_HOME_TURN = -1 / 6

const pointOnCircle = ({ radius, turn }: { radius: number; turn: number }) => ({
  x: Math.cos(turn * 2 * Math.PI) * radius,
  y: Math.sin(turn * 2 * Math.PI) * radius
})

const TICKS = Array.from({ length: TICK_COUNT }, (_, tick) => ({
  ...pointOnCircle({ radius: TICK_RADIUS, turn: tick / TICK_COUNT }),
  degrees: (tick * 360) / TICK_COUNT
}))

const HOME_SPOTS = Array.from({ length: ROOM_SEAT_LIMIT }, (_, slot) =>
  pointOnCircle({
    radius: HOME_SPOT_RADIUS,
    turn: FIRST_HOME_TURN + slot / ROOM_SEAT_LIMIT
  })
)

/**
 * The arena seen flat from above, in brass filets on felt: the platform, its
 * rim, the gutter around it, the centre marks and each seat's home spot. A
 * picture for the room to read until the game draws its own; the platform's
 * radius is 1 in its own units.
 */
export const ArenaPlan: React.FC = () => (
  <svg aria-hidden='true' className='arena-plan' viewBox='-1.2 -1.2 2.4 2.4'>
    <circle className='gutter' r='1.14' />
    <circle className='platform' r='1' />
    <circle className='rim' r='0.991' />
    <circle className='gutter-edge' r='1.135' />
    <circle className='centre-ring' r='0.503' />
    <circle className='centre-spot' r='0.056' />
    {TICKS.map(({ degrees, x, y }) => (
      <rect
        className='tick'
        height='0.035'
        key={degrees}
        transform={`translate(${x} ${y}) rotate(${degrees})`}
        width='0.035'
        x='-0.0175'
        y='-0.0175'
      />
    ))}
    {HOME_SPOTS.map(({ x, y }) => (
      <circle className='home-spot' cx={x} cy={y} key={`${x} ${y}`} r='0.168' />
    ))}
  </svg>
)
