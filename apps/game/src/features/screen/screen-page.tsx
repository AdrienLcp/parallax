import type React from 'react'

import { DisplaySoundProvider } from '@/features/sound/display-sound'
import { Main } from '@/presentation/components/main'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { ScreenNotice } from './screen-notice'
import { ScreenRoom } from './screen-room'
import { useScreenRoom } from './use-screen-room'

import './screen-page.sass'

/** What the shared display shows: the room phones join, then the game they play. */
export const ScreenPage: React.FC = () => {
  const translate = useTranslate()
  const { openAnother, state } = useScreenRoom()

  return (
    <DisplaySoundProvider>
      <Main className='screen-page'>
        {state.kind === 'failed' && (
          <ScreenNotice
            action={translate('screen.retry')}
            message={translate('screen.openFailed')}
            onAction={openAnother}
          />
        )}
        {state.kind === 'open' && (
          <ScreenRoom
            key={state.room.code}
            onRoomLost={openAnother}
            room={state.room}
          />
        )}
      </Main>
    </DisplaySoundProvider>
  )
}
