import type React from 'react'

import type { RoomCode } from '@parallax/protocol/identifiers'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './room-plaque.sass'

type RoomPlaqueProps = {
  code: RoomCode
  /** The small plaque of the play header, beside the late joiners' QR. */
  isCompact?: boolean
}

/** The room's code on an enamel plaque with an ivory inner filet. */
export const RoomPlaque: React.FC<RoomPlaqueProps> = ({ code, isCompact }) => {
  const translate = useTranslate()

  return (
    <p className='room-plaque' data-compact={isCompact ? '' : undefined}>
      <span className='room-plaque-label'>{translate('screen.roomCode')}</span>{' '}
      {code}
    </p>
  )
}
