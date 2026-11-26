import type React from 'react'
import { useEffect, useEffectEvent, useMemo, useRef } from 'react'

import type { SeatId } from '@parallax/protocol/identifiers'

import { alcoveInterior } from '@/features/alcove/alcove-bounds'
import { SHIPPED_ALCOVE } from '@/features/alcove/shipped-alcove'
import { seatNameOf } from '@/features/room/seat-name'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import type { GameSceneProps } from '../game-definition'
import { type ClawMatchView, createClawMatch } from './claw-match'
import { clawPit } from './claw-pit'
import { type ClawRenderer, createClawRenderer } from './claw-renderer'
import { sceneStandingsOf } from './claw-scene-standings'
import { useClawSimulation } from './use-claw-simulation'

import './claw-scene.sass'

const PIT = clawPit(SHIPPED_ALCOVE, alcoveInterior(SHIPPED_ALCOVE))
/** One name tag a claw, at most one claw a seat. */
const TAGS = ['a', 'b', 'c', 'd', 'e', 'f'] as const

/** The pile the room gathers in front of, before any claw hangs over it. */
const IDLE_VIEW: ClawMatchView = createClawMatch({
  pit: PIT,
  random: Math.random,
  seats: []
}).view()

/** The claw machine on the display: the pile, one claw a player and its name over it; the standings go up to the room. */
export const ClawScene: React.FC<GameSceneProps> = ({
  events,
  onStandings,
  room,
  send
}) => {
  const translate = useTranslate()
  const host = useRef<HTMLDivElement>(null)
  const renderer = useRef<ClawRenderer | null>(null)
  const tags = useRef<(HTMLElement | null)[]>([])
  const seatsRef = useRef(room.seats)

  useEffect(() => {
    seatsRef.current = room.seats
  }, [room.seats])

  useEffect(() => {
    if (host.current === null) return
    const created = createClawRenderer(host.current, PIT)
    renderer.current = created
    return () => {
      created.dispose()
      renderer.current = null
    }
  }, [])

  const seatOf = (seatId: SeatId) =>
    seatsRef.current.find((seat) => seat.seatId === seatId)

  const view = useClawSimulation({
    events,
    onFrame: (match, seconds) => {
      const drawn = renderer.current
      if (drawn === null) return
      const current = match?.view() ?? IDLE_VIEW
      const anchors = drawn.draw(
        { slotOf: (seatId) => seatOf(seatId)?.slot, view: current },
        seconds
      )
      for (const [index, tag] of tags.current.entries()) {
        if (tag == null) continue
        const claw = current.claws[index]
        const seat = claw === undefined ? undefined : seatOf(claw.seat)
        const anchor = claw === undefined ? undefined : anchors.get(claw.seat)
        tag.hidden = seat === undefined || anchor === undefined
        if (seat === undefined || anchor === undefined) continue
        tag.style.translate = `${anchor.x}px ${anchor.y}px`
        tag.dataset.seatSlot = String(seat.slot)
        const label = tag.querySelector('.claw-name')
        const name = seatNameOf(seat, translate)
        if (label !== null && label.textContent !== name) {
          label.textContent = name
        }
      }
    },
    pit: PIT,
    room,
    send
  })

  const sceneStandings = useMemo(
    () =>
      view === null
        ? null
        : sceneStandingsOf({ seats: room.seats, translate, view }),
    [room.seats, translate, view]
  )
  const publishStandings = useEffectEvent(onStandings)

  useEffect(() => {
    publishStandings(sceneStandings)
  }, [sceneStandings])

  useEffect(() => () => publishStandings(null), [])

  return (
    <div className='claw-scene'>
      <div className='claw-view' ref={host}>
        <div aria-hidden='true' className='claw-tags'>
          {TAGS.map((tag, index) => (
            <div
              className='claw-tag'
              hidden
              key={tag}
              ref={(element) => {
                tags.current[index] = element
              }}
            >
              <span className='claw-name' />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
