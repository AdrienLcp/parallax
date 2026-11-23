import type React from 'react'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'

import { paths } from '@/infrastructure/router/navigation'
import { Button } from '@/presentation/components/button'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './back-to-games.sass'

/** How long the control is held before the display leaves for the game choice. */
export const HOLD_TO_LEAVE_MS = 1200

/**
 * Leaves the room for the game choice once held down, so a passing touch never
 * ends a game: a brass ring fills while held and empties on release. Leaving
 * ends the match: reopening the room keeps its seats and starts from round 1.
 */
export const BackToGames: React.FC = () => {
  const translate = useTranslate()
  const navigate = useNavigate()
  const holdTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const release = () => clearTimeout(holdTimer.current)

  const hold = () => {
    release()
    holdTimer.current = setTimeout(
      () => void navigate(paths.home),
      HOLD_TO_LEAVE_MS
    )
  }

  useEffect(() => () => clearTimeout(holdTimer.current), [])

  return (
    <Button
      aria-label={translate('screen.backToGames.hold')}
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
      {translate('screen.backToGames.label')}
    </Button>
  )
}
