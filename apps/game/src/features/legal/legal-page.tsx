import type React from 'react'
import { useId } from 'react'

import { ANALYTICS_OPT_OUT_KEY } from '@/infrastructure/storage/analytics-opt-out-storage'
import { Main } from '@/presentation/components/main'
import { TextLink } from '@/presentation/components/text-link'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { RichText } from '@/presentation/i18n/rich-text'
import { THEME_STORAGE_KEY } from '@/theme'

import {
  CNIL_COMPLAINT_HREF,
  HOST,
  MEASUREMENT_RETENTION_MONTHS,
  PUBLISHER
} from './legal-details'
import { MeasurementSwitch } from './measurement-switch'

import './legal-page.sass'

const contactLink = (children: string): React.ReactNode => (
  <TextLink href={PUBLISHER.contactHref}>{children}</TextLink>
)

const cnilLink = (children: string): React.ReactNode => (
  <TextLink href={CNIL_COMPLAINT_HREF}>{children}</TextLink>
)

type LegalSectionProps = {
  children: React.ReactNode
  heading: string
}

const LegalSection: React.FC<LegalSectionProps> = ({ children, heading }) => {
  const headingId = useId()

  return (
    <section aria-labelledby={headingId} className='legal-section'>
      <h2 className='legal-heading' id={headingId}>
        {heading}
      </h2>
      {children}
    </section>
  )
}

/**
 * The French LCEN's legal notice and the privacy policy, on one page every
 * footer links to. A project fills in `legal-details.ts`, its own storage
 * keys and the third parties it talks to.
 */
export const LegalPage: React.FC = () => {
  const translate = useTranslate()

  return (
    <Main className='legal-page'>
      <title>{translate('legal.title')}</title>
      <div className='legal-document'>
        <h1 className='legal-title'>{translate('legal.title')}</h1>
        <p className='legal-intro'>{translate('legal.intro')}</p>

        <LegalSection heading={translate('legal.publisher.heading')}>
          <p>
            <RichText
              parts={translate.rich('legal.publisher.body', {
                contact: contactLink,
                name: PUBLISHER.name
              })}
            />
          </p>
          <p>{translate('legal.publisher.address')}</p>
        </LegalSection>

        <LegalSection heading={translate('legal.host.heading')}>
          <p>{translate('legal.host.body')}</p>
          <address className='host-address'>
            {[HOST.name, ...HOST.addressLines].map((line) => (
              <span key={line}>{line}</span>
            ))}
          </address>
        </LegalSection>

        <LegalSection heading={translate('legal.storage.heading')}>
          <p>{translate('legal.storage.device')}</p>
          <dl className='stored-keys'>
            <dt>
              <code>{THEME_STORAGE_KEY}</code>
            </dt>
            <dd>{translate('legal.storage.theme')}</dd>
            <dt>
              <code>{ANALYTICS_OPT_OUT_KEY}</code>
            </dt>
            <dd>{translate('legal.storage.analyticsOptOut')}</dd>
          </dl>
          <p>{translate('legal.storage.server')}</p>
        </LegalSection>

        <LegalSection heading={translate('legal.measurement.heading')}>
          <p>{translate('legal.measurement.body')}</p>
          <p>
            {translate('legal.measurement.retention', {
              months: MEASUREMENT_RETENTION_MONTHS
            })}
          </p>
          <p>{translate('legal.measurement.exemption')}</p>
          <MeasurementSwitch />
        </LegalSection>

        <LegalSection heading={translate('legal.thirdParties.heading')}>
          <p>{translate('legal.thirdParties.body')}</p>
        </LegalSection>

        <LegalSection heading={translate('legal.rights.heading')}>
          <p>
            <RichText
              parts={translate.rich('legal.rights.body', {
                contact: contactLink
              })}
            />
          </p>
          <p>
            <RichText
              parts={translate.rich('legal.rights.complaint', {
                authority: cnilLink
              })}
            />
          </p>
        </LegalSection>
      </div>
    </Main>
  )
}
