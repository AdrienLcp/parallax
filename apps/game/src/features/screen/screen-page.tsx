import type React from 'react'

import { CURRENT_GAME, games } from '@/features/games/games'
import { Button } from '@/presentation/components/button'
import { Main } from '@/presentation/components/main'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { ScreenRoom } from './screen-room'
import { useScreenRoom } from './use-screen-room'

/** What the shared display shows: the room phones join, then the game they play. */
export const ScreenPage: React.FC = () => {
  const translate = useTranslate()
  const { openAnother, state } = useScreenRoom()

  return (
    <Main className='screen-page'>
      <h1>{translate(games[CURRENT_GAME].name)}</h1>
      {state.kind === 'failed' && (
        <>
          <p>{translate('screen.openFailed')}</p>
          <Button onPress={openAnother}>{translate('screen.retry')}</Button>
        </>
      )}
      {state.kind === 'open' && (
        <ScreenRoom
          key={state.room.code}
          onRoomLost={openAnother}
          room={state.room}
        />
      )}
    </Main>
  )
}
