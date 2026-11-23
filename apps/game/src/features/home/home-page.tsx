import type React from 'react'

import { paths } from '@/infrastructure/router/navigation'
import { Main } from '@/presentation/components/main'
import { TextLink } from '@/presentation/components/text-link'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './home-page.sass'

export const HomePage: React.FC = () => {
  const translate = useTranslate()

  return (
    <Main className='home-page'>
      <h1>{translate('home.title')}</h1>
      <TextLink href={paths.screen}>{translate('home.host')}</TextLink>
    </Main>
  )
}
