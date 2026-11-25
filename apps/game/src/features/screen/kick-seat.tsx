import type React from 'react'

import { Button } from '@/presentation/components/button'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './kick-seat.sass'

type KickSeatProps = {
  /** The seat's name, for the control's accessible label. */
  name: string
  onKick: () => void
}

/**
 * Removes a seat from the room, at the display's mouse only: it shows while
 * the pointer is over its seat, so the room never sees it from across the
 * floor. The removed phone is told; it may scan the code again for a new seat.
 */
export const KickSeat: React.FC<KickSeatProps> = ({ name, onKick }) => {
  const translate = useTranslate()

  return (
    <Button
      aria-label={translate('screen.seat.kick', { name })}
      className='kick-seat'
      onPress={onKick}
    >
      <svg aria-hidden='true' viewBox='0 0 24 24'>
        <path d='M6 6 L18 18 M18 6 L6 18' />
      </svg>
    </Button>
  )
}
