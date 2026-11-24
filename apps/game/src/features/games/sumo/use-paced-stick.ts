import { useEffect, useEffectEvent, useRef } from 'react'

import type { PlayerRoomMessage } from '@parallax/protocol/server-message'

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
 *
 * Each new `room` may answer a reconnection, and the screen forgets the stick
 * of a seat that went absent: the next tick sends the stick again, even under
 * a thumb that held still. The room drops what it cannot forward while the
 * display is away, and the display's return sends every phone a new `room`:
 * that stick comes back the same way.
 */
export const usePacedStick = (
  send: (stick: PlanarVector) => boolean,
  room: PlayerRoomMessage
): ((stick: PlanarVector) => void) => {
  const latestStickRef = useRef<PlanarVector>(ORIGIN)
  const sendStick = useEffectEvent(send)
  const latestRoom = useEffectEvent(() => room)

  useEffect(() => {
    let lastSent: PlanarVector | null = null
    let roomAtLastSend: PlayerRoomMessage | null = null

    const timer = setInterval(() => {
      if (latestRoom() !== roomAtLastSend) {
        lastSent = null
      }

      if (!hasStickMoved(lastSent, latestStickRef.current)) {
        return
      }

      const stick = steppedStick(latestStickRef.current)

      if (sendStick(stick)) {
        lastSent = stick
        roomAtLastSend = latestRoom()
      }
    }, STICK_SEND_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [])

  return (stick) => {
    latestStickRef.current = stick
  }
}
