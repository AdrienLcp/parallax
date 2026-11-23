import type React from 'react'
import { useEffect, useRef, useState } from 'react'

import type { GameSceneProps } from '../game-definition'
import { arenaFrameOf } from './arena-frame'
import type { ArenaRenderer } from './arena-renderer'
import { EjectionBand } from './ejection-band'
import { createFlatPortraitRenderer } from './flat-portrait-renderer'
import { countdownShown } from './sumo-match'
import { useSumoSimulation } from './use-sumo-simulation'

import './sumo-scene.sass'

/** The sumo on the display: the arena drawn by its renderer, the countdown, and a band for each ejection. */
export const SumoScene: React.FC<GameSceneProps> = ({ events, room, send }) => {
  const host = useRef<HTMLDivElement>(null)
  const renderer = useRef<ArenaRenderer | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)

  useEffect(() => {
    if (host.current === null) {
      return
    }

    const created = createFlatPortraitRenderer(host.current)
    renderer.current = created

    return () => {
      created.dispose()
      renderer.current = null
    }
  }, [])

  const { dismissEjection, ejections } = useSumoSimulation({
    events,
    onFrame: (match, seconds) => {
      renderer.current?.draw(
        arenaFrameOf({ match, seats: room.seats }),
        seconds
      )
      setCountdown(countdownShown(match))
    },
    room,
    send
  })

  return (
    <div className='sumo-scene'>
      <div className='arena-view' ref={host} />
      {countdown !== null && (
        <p aria-hidden='true' className='countdown' key={countdown}>
          {countdown}
        </p>
      )}
      {ejections.map((ejection) => {
        const slot = room.seats.find(
          (seat) => seat.seatId === ejection.seat
        )?.slot

        return (
          slot !== undefined && (
            <EjectionBand
              key={ejection.id}
              onDone={() => dismissEjection(ejection.id)}
              slot={slot}
            />
          )
        )
      })}
    </div>
  )
}
