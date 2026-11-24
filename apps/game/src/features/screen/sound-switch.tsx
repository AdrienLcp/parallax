import type React from 'react'

import { useDisplaySound } from '@/features/sound/display-sound'
import { Button } from '@/presentation/components/button'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './sound-switch.sass'

/** Turns the display's music and cues on or off, a speaker that shows waves or a cross. */
export const SoundSwitch: React.FC = () => {
  const translate = useTranslate()
  const { isMuted, toggleMuted } = useDisplaySound()

  return (
    <Button
      aria-label={translate('screen.sound')}
      aria-pressed={!isMuted}
      className='sound-switch'
      onPress={toggleMuted}
    >
      <svg aria-hidden='true' className='sound-icon' viewBox='0 0 48 48'>
        <path className='sound-speaker' d='M8 19 H15 L25 11 V37 L15 29 H8 Z' />
        {isMuted ? (
          <path className='sound-cross' d='M31 19 L41 29 M41 19 L31 29' />
        ) : (
          <>
            <path className='sound-wave' d='M31 18 Q35 24 31 30' />
            <path className='sound-wave' d='M36 13 Q43 24 36 35' />
          </>
        )}
      </svg>
    </Button>
  )
}
