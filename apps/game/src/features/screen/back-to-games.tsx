import type React from 'react'
import { useEffect, useRef } from 'react'

import { Button } from '@/presentation/components/button'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './back-to-games.sass'

/** How long the control is held before the display leaves for the game choice. */
export const HOLD_TO_LEAVE_MS = 1200

type BackToGamesProps = {
  /** A game runs: holding stops it, back to the room's lobby. */
  isPlaying: boolean
  onLeave: () => void
  onStop: () => void
}

/**
 * Held down at the display's mouse, so a passing click never ends a game: a
 * ring fills while held and empties on release. While a game runs it stops
 * the game, every seat kept in the room's lobby; in the lobby it leaves for
 * the game choice, and the room waits there for the next game.
 */
export const BackToGames: React.FC<BackToGamesProps> = ({
  isPlaying,
  onLeave,
  onStop
}) => {
  const translate = useTranslate()
  const holdTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const release = () => clearTimeout(holdTimer.current)

  const hold = () => {
    release()
    holdTimer.current = setTimeout(
      isPlaying ? onStop : onLeave,
      HOLD_TO_LEAVE_MS
    )
  }

  useEffect(() => () => clearTimeout(holdTimer.current), [])

  return (
    <Button
      aria-label={translate(
        isPlaying ? 'screen.stopGame.hold' : 'screen.backToGames.hold'
      )}
      className='back-to-games'
      onPressEnd={release}
      onPressStart={hold}
      style={{ '--hold-to-leave-duration': `${HOLD_TO_LEAVE_MS}ms` }}
    >
      <svg aria-hidden='true' className='hold-gauge' viewBox='0 0 48 48'>
        <circle className='hold-track' cx='24' cy='24' r='20' />
        <circle className='hold-fill' cx='24' cy='24' pathLength='100' r='20' />
        <path className='hold-chevron' d='M27 15 L18 24 L27 33' />
      </svg>
      {translate(
        isPlaying ? 'screen.stopGame.label' : 'screen.backToGames.label'
      )}
    </Button>
  )
}
