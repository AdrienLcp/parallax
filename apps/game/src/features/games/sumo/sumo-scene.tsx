import type React from 'react'
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import type { GameSceneProps } from '../game-definition'
import { arenaFrameOf } from './arena-frame'
import type { ArenaRenderer } from './arena-renderer'
import { createFlatPortraitRenderer } from './flat-portrait-renderer'
import { countdownShown } from './sumo-match'
import { sceneStandingsOf } from './sumo-scene-standings'
import { useSumoSimulation } from './use-sumo-simulation'

import './sumo-scene.sass'

/** The sumo on the display: the arena drawn by its renderer and the countdown; the standings go up to the room. */
export const SumoScene: React.FC<GameSceneProps> = ({
  events,
  onStandings,
  room,
  send
}) => {
  const translate = useTranslate()
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

  const standings = useSumoSimulation({
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

  const sceneStandings = useMemo(
    () =>
      standings === null
        ? null
        : sceneStandingsOf({ seats: room.seats, standings, translate }),
    [room.seats, standings, translate]
  )
  const publishStandings = useEffectEvent(onStandings)

  useEffect(() => {
    publishStandings(sceneStandings)
  }, [sceneStandings])

  useEffect(() => () => publishStandings(null), [])

  return (
    <div className='sumo-scene'>
      <div className='arena-view' ref={host} />
      {countdown !== null && (
        <p aria-hidden='true' className='countdown' key={countdown}>
          {countdown}
        </p>
      )}
    </div>
  )
}
