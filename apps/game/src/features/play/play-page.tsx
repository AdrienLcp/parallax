import type React from 'react'

import { CURRENT_GAME } from '@/features/games/games'
import { useRoomCodeParam } from '@/infrastructure/router/navigation'
import { Main } from '@/presentation/components/main'

import { PlayerSeat } from './player-seat'
import { RoomNotice } from './room-notice'

import './play-page.sass'

/** What a phone shows once it joined a room by its code: held to the screen, edge to edge. */
export const PlayPage: React.FC = () => {
  const roomCode = useRoomCodeParam()

  return (
    <Main className='play-page' data-game={CURRENT_GAME}>
      {roomCode === null ? (
        <RoomNotice
          canRetry={false}
          kind='refused'
          reason='play.refused.roomGone'
          roomCode={null}
        />
      ) : (
        <PlayerSeat key={roomCode} roomCode={roomCode} />
      )}
    </Main>
  )
}
