import type React from 'react'
import { useEffect, useState } from 'react'

import { vibrate } from '@/infrastructure/browser'
import { Button } from '@/presentation/components/button'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { SUMO_TUNING } from './sumo-tuning'

import './dash-button.sass'

const PRESS_BUZZ_MS = 25

type CooldownButtonProps = {
  className: string
  cooldownSeconds: number
  icon: React.ReactNode
  label: string
  onPress: () => void
}

/**
 * A thumb's move: fires as the thumb lands, then rests while the top cools
 * down, its brass ring filling back meanwhile.
 */
const CooldownButton: React.FC<CooldownButtonProps> = ({
  className,
  cooldownSeconds,
  icon,
  label,
  onPress
}) => {
  const [isCooling, setIsCooling] = useState(false)
  const cooldownMs = cooldownSeconds * 1000

  useEffect(() => {
    if (!isCooling) {
      return
    }

    const timer = setTimeout(() => setIsCooling(false), cooldownMs)

    return () => clearTimeout(timer)
  }, [cooldownMs, isCooling])

  const press = () => {
    onPress()
    vibrate(PRESS_BUZZ_MS)
    setIsCooling(true)
  }

  return (
    <Button
      className={`thumb-button ${className}`}
      isDisabled={isCooling}
      onPressStart={press}
      style={{ '--thumb-cooldown': `${cooldownMs}ms` }}
    >
      {icon}
      <span className='thumb-label'>{label}</span>
      <svg aria-hidden='true' className='thumb-gauge' viewBox='0 0 100 100'>
        <circle cx='50' cy='50' pathLength='100' r='48' />
      </svg>
    </Button>
  )
}

/** The right thumb's dash: a burst along the stick. */
export const DashButton: React.FC<{ onDash: () => void }> = ({ onDash }) => {
  const translate = useTranslate()

  return (
    <CooldownButton
      className='dash-button'
      cooldownSeconds={SUMO_TUNING.dashCooldownSeconds}
      icon={
        <svg aria-hidden='true' className='thumb-icon' viewBox='0 0 48 48'>
          <path d='M8 40 L24 8 L40 40 L24 30 Z' fill='currentColor' />
        </svg>
      }
      label={translate('sumo.dash')}
      onPress={onDash}
    />
  )
}

/** The right thumb's jump, over the dash: in the air, a rival's dash passes under. */
export const JumpButton: React.FC<{ onJump: () => void }> = ({ onJump }) => {
  const translate = useTranslate()

  return (
    <CooldownButton
      className='jump-button'
      cooldownSeconds={SUMO_TUNING.jumpCooldownSeconds}
      icon={
        <svg aria-hidden='true' className='thumb-icon' viewBox='0 0 48 48'>
          <path
            d='M8 42 Q24 2 40 42'
            fill='none'
            stroke='currentColor'
            strokeLinecap='round'
            strokeWidth='4'
          />
          <circle cx='24' cy='20' fill='currentColor' r='6' />
        </svg>
      }
      label={translate('sumo.jump')}
      onPress={onJump}
    />
  )
}
