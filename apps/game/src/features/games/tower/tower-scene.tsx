import type React from 'react'
import { useEffect, useEffectEvent, useMemo, useRef } from 'react'

import type { SeatId } from '@parallax/protocol/identifiers'
import type { Seat } from '@parallax/protocol/room'

import { alcoveInterior } from '@/features/alcove/alcove-bounds'
import { SHIPPED_ALCOVE } from '@/features/alcove/shipped-alcove'
import { seatNameOf } from '@/features/room/seat-name'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import type { GameSceneProps } from '../game-definition'
import type { TowerMatch } from './tower-match'
import {
  createTowerRenderer,
  type LaneAnchors,
  type TowerRenderer
} from './tower-renderer'
import { formatHeight, sceneStandingsOf } from './tower-scene-standings'
import { useTowerSimulation } from './use-tower-simulation'

import './tower-scene.sass'

const INTERIOR = alcoveInterior(SHIPPED_ALCOVE)
/** One pencil mark and one name tag per lane, at most one lane a seat. */
const LANES = ['a', 'b', 'c', 'd', 'e', 'f'] as const
const MOST_LANES = LANES.length

/** The pencil marks and name tags over the canvas, moved every frame without React. */
const placeMarks = ({
  anchors,
  heights,
  marks,
  names,
  tags
}: {
  anchors: readonly LaneAnchors[]
  heights: readonly string[]
  marks: readonly (HTMLElement | null)[]
  names: readonly (Seat | undefined)[]
  tags: readonly (HTMLElement | null)[]
}) => {
  for (let index = 0; index < MOST_LANES; index += 1) {
    const anchor = anchors[index]
    const mark = marks[index]
    const tag = tags[index]
    const height = heights[index]
    if (mark != null) {
      mark.hidden = anchor === undefined || !height
      if (anchor !== undefined) {
        mark.style.translate = `${anchor.height.x}px ${anchor.height.y}px`
        const label = mark.querySelector('.height-label')
        if (label !== null && label.textContent !== height)
          label.textContent = height ?? ''
      }
    }
    if (tag != null) {
      const seat = names[index]
      tag.hidden = anchor?.floating == null || seat === undefined
      if (anchor?.floating != null && seat !== undefined) {
        tag.style.translate = `${anchor.floating.x}px ${anchor.floating.y}px`
        tag.dataset.seatSlot = String(seat.slot)
      }
    }
  }
}

/** The tower on the display: blocks standing in the alcove, a pencil mark at each tower's top, the name of whoever holds the floating block; the standings go up to the room. */
export const TowerScene: React.FC<GameSceneProps> = ({
  events,
  onStandings,
  room,
  send
}) => {
  const translate = useTranslate()
  const host = useRef<HTMLDivElement>(null)
  const renderer = useRef<TowerRenderer | null>(null)
  const marks = useRef<(HTMLElement | null)[]>([])
  const tags = useRef<(HTMLElement | null)[]>([])
  const seatsRef = useRef(room.seats)

  useEffect(() => {
    seatsRef.current = room.seats
  }, [room.seats])

  useEffect(() => {
    if (host.current === null) return
    const created = createTowerRenderer(host.current, INTERIOR)
    renderer.current = created
    return () => {
      created.dispose()
      renderer.current = null
    }
  }, [])

  const seatOf = (seatId: SeatId) =>
    seatsRef.current.find((seat) => seat.seatId === seatId)

  const { view } = useTowerSimulation({
    events,
    interior: INTERIOR,
    onFrame: (match: TowerMatch | null, seconds) => {
      const drawn = renderer.current
      if (drawn === null) return
      const view = match?.view() ?? {
        elapsed: 0,
        lanes: [],
        outcome: null,
        rule: 'shared' as const
      }
      const anchors = drawn.draw(
        {
          landings:
            match === null
              ? []
              : view.lanes.map((lane) => match.landingOf(lane)),
          poseOf: (handle) =>
            match?.poseOf(handle) ?? {
              position: { x: 0, y: 0, z: 0 },
              quaternion: { w: 1, x: 0, y: 0, z: 0 }
            },
          slotOf: (seatId) => seatOf(seatId)?.slot,
          view
        },
        seconds
      )
      placeMarks({
        anchors,
        heights: view.lanes.map((lane) =>
          lane.height > 0 ? formatHeight(lane.height, translate) : ''
        ),
        marks: marks.current,
        names: view.lanes.map((lane) =>
          lane.floating === null ? undefined : seatOf(lane.floating.seat)
        ),
        tags: tags.current
      })
      for (const [index, tag] of tags.current.entries()) {
        const seatId = view.lanes[index]?.floating?.seat
        const seat = seatId === undefined ? undefined : seatOf(seatId)
        const label = tag?.querySelector('.float-name')
        const name = seat === undefined ? '' : seatNameOf(seat, translate)
        if (label != null && label.textContent !== name)
          label.textContent = name
      }
    },
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
    <div className='tower-scene'>
      <div className='tower-view' ref={host}>
        <div aria-hidden='true' className='tower-marks'>
          {LANES.map((lane, index) => (
            <div
              className='height-mark'
              hidden
              key={`mark-${lane}`}
              ref={(element) => {
                marks.current[index] = element
              }}
            >
              <span className='height-label' />
            </div>
          ))}
          {LANES.map((lane, index) => (
            <div
              className='float-tag'
              hidden
              key={`tag-${lane}`}
              ref={(element) => {
                tags.current[index] = element
              }}
            >
              <span className='float-name' />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
