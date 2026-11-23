import type React from 'react'

import { useRoomCodeParam } from '@/infrastructure/router/navigation'
import { Main } from '@/presentation/components/main'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { PlayerSeat } from './player-seat'

/** What a phone shows once it joined a room by its code. */
export const PlayPage: React.FC = () => {
  const translate = useTranslate()
  const roomCode = useRoomCodeParam()

  return (
    <Main className='play-page'>
      {roomCode === null ? (
        <p>{translate('play.refused.roomGone')}</p>
      ) : (
        <PlayerSeat key={roomCode} roomCode={roomCode} />
      )}
    </Main>
  )
}
