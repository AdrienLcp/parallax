import { classNames } from '@adrienlcp/react'
import type React from 'react'

import type { SeatSlot } from '@parallax/protocol/room'

import './seat-top.sass'

/**
 * The mark carved in each slot's cap, so seats differ by shape as well as by
 * lacquer for colour-blind players. Drawn in a 100 × 100 box.
 */
export const SEAT_GLYPHS = [
  <circle cx='50' cy='50' key='circle' r='41' />,
  <path d='M50 8 L95 86 L5 86 Z' key='triangle' />,
  <rect height='72' key='square' width='72' x='14' y='14' />,
  <path d='M50 4 L92 50 L50 96 L8 50 Z' key='diamond' />,
  <path d='M37 6 H63 V37 H94 V63 H63 V94 H37 V63 H6 V37 H37 Z' key='cross' />,
  <path d='M50 6 L90 28 L90 72 L50 94 L10 72 L10 28 Z' key='hexagon' />
] as const satisfies Record<SeatSlot, React.ReactElement>

type SeatTopProps = {
  className?: string
  slot: SeatSlot
}

/**
 * A seat's spinning top seen from above: its lacquer, its cap and its glyph.
 * Decorative: whoever shows it names the seat beside it. Sized by its box.
 */
export const SeatTop: React.FC<SeatTopProps> = ({ className, slot }) => (
  <svg
    aria-hidden='true'
    className={classNames('seat-top', className)}
    data-seat-slot={slot}
    viewBox='0 0 100 100'
  >
    <circle className='lacquer' cx='50' cy='50' r='46' />
    <circle className='cap' cx='50' cy='50' r='30' />
    <g className='glyph' transform='translate(32 32) scale(0.36)'>
      {SEAT_GLYPHS[slot]}
    </g>
  </svg>
)
