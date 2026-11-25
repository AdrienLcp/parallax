import type React from 'react'
import { useState } from 'react'

import { TuningLayer } from '@/features/display-tuning/tuning-layer'
import { DEFAULT_GAME_ID, type GameId } from '@/features/games/games'
import { DisplaySoundProvider } from '@/features/sound/display-sound'
import { useGameParam } from '@/infrastructure/router/navigation'
import { Main } from '@/presentation/components/main'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { ScreenNotice } from './screen-notice'
import { ScreenRoom } from './screen-room'
import { useScreenRoom } from './use-screen-room'

import './screen-page.sass'

/** What the shared display shows: the room phones join, then the game they play. */
export const ScreenPage: React.FC = () => {
  const translate = useTranslate()
  const askedGame = useGameParam()
  const { openAnother, state } = useScreenRoom(askedGame ?? DEFAULT_GAME_ID)
  const [roomGame, setRoomGame] = useState<GameId | null>(null)

  return (
    <DisplaySoundProvider>
      <Main
        className='screen-page'
        data-game={roomGame ?? askedGame ?? DEFAULT_GAME_ID}
      >
        {state.kind === 'failed' && (
          <ScreenNotice
            action={translate('screen.retry')}
            message={translate('screen.openFailed')}
            onAction={openAnother}
          />
        )}
        {state.kind === 'open' && (
          <ScreenRoom
            askedGame={askedGame}
            key={state.room.code}
            onGame={setRoomGame}
            onRoomLost={openAnother}
            room={state.room}
          />
        )}
        <TuningLayer />
      </Main>
    </DisplaySoundProvider>
  )
}
