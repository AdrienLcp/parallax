import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'

import { keepInstallOffer } from '@/features/install/install-prompt'
import { preferredLocales } from '@/infrastructure/browser'
import { routes } from '@/infrastructure/router/routes'
import { i18n } from '@/presentation/i18n/i18n'
import { I18nProvider } from '@/presentation/i18n/i18n-provider'
import { applyInitialLocale } from '@/presentation/i18n/initial-locale'

import '@/presentation/styles/globals.sass'

const container = document.getElementById('root')

if (container === null) {
  throw new Error('Missing #root in index.html')
}

keepInstallOffer()

const locale = applyInitialLocale()
const translate = await i18n.load(locale, { formatLocale: preferredLocales() })

createRoot(container).render(
  <StrictMode>
    <I18nProvider locale={locale} translate={translate}>
      <RouterProvider router={createBrowserRouter(routes)} />
    </I18nProvider>
  </StrictMode>
)
