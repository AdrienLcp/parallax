import { useEffect, useEffectEvent, useRef } from 'react'

import { ORIGIN, type PlanarVector } from '@/helpers/planar-vector'

import {
  hasStickMoved,
  STICK_SEND_INTERVAL_MS,
  steppedStick
} from './stick-pacing'

/**
 * Holds the thumb's latest stick and sends it at most `SUMO_STICK_HZ` times a
 * second, only when it moved. `send` answers whether the frame left: one
 * dropped during a reconnection goes again on the next tick.
 */
export const usePacedStick = (
  send: (stick: PlanarVector) => boolean
): ((stick: PlanarVector) => void) => {
  const latestStickRef = useRef<PlanarVector>(ORIGIN)
  const sendStick = useEffectEvent(send)

  useEffect(() => {
    let lastSent: PlanarVector | null = null

    const timer = setInterval(() => {
      if (!hasStickMoved(lastSent, latestStickRef.current)) {
        return
      }

      const stick = steppedStick(latestStickRef.current)

      if (sendStick(stick)) {
        lastSent = stick
      }
    }, STICK_SEND_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [])

  return (stick) => {
    latestStickRef.current = stick
  }
}
