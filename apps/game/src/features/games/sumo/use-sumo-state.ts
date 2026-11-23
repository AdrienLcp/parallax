import { useEffect, useState } from 'react'

import type { SumoState } from '@parallax/protocol/sumo'

import type { EventSubscription } from '@/helpers/event-channel'

import type { PlayerGameEvent } from '../game-definition'

/** The last `sumo.state` the screen sent, or `null` until the first one arrives. */
export const useSumoState = (
  events: EventSubscription<PlayerGameEvent>
): SumoState | null => {
  const [state, setState] = useState<SumoState | null>(null)

  useEffect(
    () =>
      events.subscribe((event) => {
        if (event.type === 'sumo.state') {
          setState(event)
        }
      }),
    [events]
  )

  return state
}
