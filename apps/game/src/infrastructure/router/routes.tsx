import type React from 'react'
import type { RouteObject } from 'react-router'

import { paths } from '@/infrastructure/router/navigation'
import { RootRoute } from '@/infrastructure/router/root-route'

type RoutedPath = (typeof paths)[keyof typeof paths]

const pageFor = {
  [paths.home]: async () => ({
    Component: (await import('@/features/home/home-page')).HomePage
  }),
  [paths.legal]: async () => ({
    Component: (await import('@/features/legal/legal-page')).LegalPage
  })
} satisfies Record<RoutedPath, RouteObject['lazy']>

/** The app renders in the browser only: nothing to show while the first lazy page loads. */
const BlankWhileFirstPageLoads: React.FC = () => null

export const routes: RouteObject[] = [
  {
    Component: RootRoute,
    children: Object.values(paths).map((path) => ({
      lazy: pageFor[path],
      path
    })),
    HydrateFallback: BlankWhileFirstPageLoads
  }
]
