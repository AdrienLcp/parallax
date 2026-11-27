import type React from 'react'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { useInstall } from './install-prompt'

import './install-button.sass'

const InstallPictogram: React.FC = () => (
  <svg
    aria-hidden='true'
    className='install-pictogram'
    fill='none'
    stroke='currentColor'
    strokeLinecap='round'
    strokeLinejoin='round'
    strokeWidth='4'
    viewBox='0 0 48 48'
  >
    <path d='M24 8 V30 M15 21 L24 30 L33 21' />
    <path d='M10 36 V40 H38 V36' />
  </svg>
)

type InstallButtonProps = {
  className?: string
}

/** Installs Parallax on the phone, shown only while the browser offers it. */
export const InstallButton: React.FC<InstallButtonProps> = ({ className }) => {
  const translate = useTranslate()
  const install = useInstall()

  if (install === null) return null

  return (
    <button
      className={`install-button ${className ?? ''}`}
      onClick={install}
      type='button'
    >
      <InstallPictogram />
      {translate('install')}
    </button>
  )
}
