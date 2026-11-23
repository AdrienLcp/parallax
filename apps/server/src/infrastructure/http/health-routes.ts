import type { HealthResponse } from '@parallax/protocol/http'
import { API_ROUTES } from '@parallax/protocol/routes'
import { PROTOCOL_VERSION } from '@parallax/protocol/version'

import type { WorkerApp } from './worker-app'

export const registerHealthRoutes = (app: WorkerApp) => {
  app.get(API_ROUTES.health, (context) => {
    const body: HealthResponse = {
      protocolVersion: PROTOCOL_VERSION,
      status: 'ok'
    }

    return context.json(body)
  })
}
