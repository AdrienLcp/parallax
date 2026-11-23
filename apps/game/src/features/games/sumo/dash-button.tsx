import type React from 'react'
import { useEffect, useState } from 'react'

import { vibrate } from '@/infrastructure/browser'
import { Button } from '@/presentation/components/button'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { SUMO_TUNING } from './sumo-tuning'

import './dash-button.sass'

const DASH_BUZZ_MS = 25

const DASH_COOLDOWN_MS = SUMO_TUNING.dashCooldownSeconds * 1000

type DashButtonProps = {
  onDash: () => void
}

/**
 * The right thumb's dash: fires as the thumb lands, then rests while the top
 * cools down, its brass ring filling back meanwhile.
 */
export const DashButton: React.FC<DashButtonProps> = ({ onDash }) => {
  const translate = useTranslate()
  const [isCooling, setIsCooling] = useState(false)

  useEffect(() => {
    if (!isCooling) {
      return
    }

    const timer = setTimeout(() => setIsCooling(false), DASH_COOLDOWN_MS)

    return () => clearTimeout(timer)
  }, [isCooling])

  const dash = () => {
    onDash()
    vibrate(DASH_BUZZ_MS)
    setIsCooling(true)
  }

  return (
    <Button
      className='dash-button'
      isDisabled={isCooling}
      onPressStart={dash}
      style={{ '--dash-cooldown': `${DASH_COOLDOWN_MS}ms` }}
    >
      <svg aria-hidden='true' className='dash-arrow' viewBox='0 0 48 48'>
        <path d='M8 40 L24 8 L40 40 L24 30 Z' fill='currentColor' />
      </svg>
      <span className='dash-label'>{translate('sumo.dash')}</span>
      <svg aria-hidden='true' className='dash-gauge' viewBox='0 0 100 100'>
        <circle cx='50' cy='50' pathLength='100' r='48' />
      </svg>
    </Button>
  )
}
