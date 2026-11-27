import type React from 'react'
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'

import type { SeatId } from '@parallax/protocol/identifiers'

import { alcoveInterior } from '@/features/alcove/alcove-bounds'
import { SHIPPED_ALCOVE } from '@/features/alcove/shipped-alcove'
import { useI18n } from '@/presentation/i18n/i18n-context'

import type { GameSceneProps } from '../game-definition'
import {
  createGlobeJudge,
  type GlobeJudge,
  loadGlobeAtlas
} from './globe-atlas'
import { createGlobeRenderer, type GlobeRenderer } from './globe-renderer'
import { sceneStandingsOf } from './globe-scene-standings'
import { globeStand } from './globe-stand'
import { useGlobeSimulation } from './use-globe-simulation'

import './globe-scene.sass'

const STAND = globeStand(SHIPPED_ALCOVE, alcoveInterior(SHIPPED_ALCOVE))

/** The globe on the display, turned by whoever holds it; the place, the clock and the result go up to the room's header. */
export const GlobeScene: React.FC<GameSceneProps> = ({
  events,
  onStandings,
  room,
  send
}) => {
  const { locale, translate } = useI18n()
  const host = useRef<HTMLDivElement>(null)
  const renderer = useRef<GlobeRenderer | null>(null)
  const seatsRef = useRef(room.seats)
  const [judge, setJudge] = useState<GlobeJudge | null>(null)

  useEffect(() => {
    seatsRef.current = room.seats
  }, [room.seats])

  useEffect(() => {
    if (host.current === null) return
    const created = createGlobeRenderer(host.current, STAND, { hasShelf: true })
    renderer.current = created
    let isMounted = true
    void loadGlobeAtlas().then((atlas) => {
      if (!isMounted) return
      created.paint(atlas)
      setJudge(() => createGlobeJudge(atlas))
    })
    return () => {
      isMounted = false
      created.dispose()
      renderer.current = null
    }
  }, [])

  const slotOf = (seatId: SeatId) =>
    seatsRef.current.find((seat) => seat.seatId === seatId)?.slot

  const view = useGlobeSimulation({
    events,
    judge,
    onFrame: (match, seconds) => {
      renderer.current?.draw({ slotOf, view: match?.view() ?? null }, seconds)
    },
    room,
    send
  })

  const sceneStandings = useMemo(
    () =>
      view === null
        ? null
        : sceneStandingsOf({ locale, seats: room.seats, translate, view }),
    [locale, room.seats, translate, view]
  )
  const publishStandings = useEffectEvent(onStandings)

  useEffect(() => {
    publishStandings(sceneStandings)
  }, [sceneStandings])

  useEffect(() => () => publishStandings(null), [])

  return (
    <div className='globe-scene'>
      <div className='globe-view' ref={host} />
    </div>
  )
}
