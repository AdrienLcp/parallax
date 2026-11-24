import type React from 'react'

import { Button } from '@/presentation/components/button'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { useFullscreen } from './use-fullscreen'

import './fullscreen-switch.sass'

/**
 * Fills the display's panel or gives the browser back, four corners that
 * point out or in. Absent where the browser cannot go fullscreen.
 */
export const FullscreenSwitch: React.FC = () => {
  const translate = useTranslate()
  const { isAvailable, isFullscreen, toggleFullscreen } = useFullscreen()

  if (!isAvailable) return null

  const label = translate('screen.fullscreen')

  return (
    <Button
      aria-label={label}
      aria-pressed={isFullscreen}
      className='fullscreen-switch'
      onPress={toggleFullscreen}
    >
      <svg aria-hidden='true' className='fullscreen-icon' viewBox='0 0 48 48'>
        <title>{label}</title>
        {isFullscreen ? (
          <path d='M18 8 V18 H8 M30 8 V18 H40 M40 30 H30 V40 M8 30 H18 V40' />
        ) : (
          <path d='M8 18 V8 H18 M30 8 H40 V18 M40 30 V40 H30 M18 40 H8 V30' />
        )}
      </svg>
    </Button>
  )
}
