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
  }),
  [paths.play]: async () => ({
    Component: (await import('@/features/play/play-page')).PlayPage
  }),
  [paths.screen]: async () => ({
    Component: (await import('@/features/screen/screen-page')).ScreenPage
  }),
  [paths.shipsLab]: async () => ({
    Component: (await import('@/features/ships-lab/ships-lab-index'))
      .ShipsLabIndex
  }),
  [paths.shipsLabPad]: async () => ({
    Component: (await import('@/features/ships-lab/ships-lab-pad')).ShipsLabPad
  }),
  [paths.shipsLabScreen]: async () => ({
    Component: (await import('@/features/ships-lab/ships-lab-screen'))
      .ShipsLabScreen
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
