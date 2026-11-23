import type React from 'react'
import { useImperativeHandle, useRef } from 'react'

import type { Seat, SeatSlot } from '@parallax/protocol/room'

import { seatNameKey } from '@/features/room/seat-name'
import { SeatTop } from '@/features/room/seat-top'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import type { ArenaFrame } from './arena-frame'
import type { TagAnchor } from './arena-renderer'

import './top-tags.sass'

/** A falling top's tag is gone by the time the top is halfway down the gutter. */
const TAG_FADE_PER_FALL = 2

/** Moves the tags onto the tops on every display frame, outside React's renders. */
export type TopTagsHandle = {
  place: (frame: ArenaFrame, anchors: readonly TagAnchor[]) => void
}

type TopTagsProps = {
  ref: React.Ref<TopTagsHandle>
  seats: readonly Seat[]
}

/**
 * A slate tag over each top on the arena, its glyph and its seat's name, so a
 * player finds their own top from across the room. It turns brass while the
 * top's dash recharges.
 */
export const TopTags: React.FC<TopTagsProps> = ({ ref, seats }) => {
  const translate = useTranslate()
  const tags = useRef(new Map<SeatSlot, HTMLElement>())

  useImperativeHandle(
    ref,
    () => ({
      place: (frame, anchors) => {
        const anchorBySlot = new Map(
          anchors.map((anchor) => [anchor.slot, anchor])
        )
        const drawnBySlot = new Map(frame.tops.map((top) => [top.slot, top]))

        for (const [slot, tag] of tags.current) {
          const anchor = anchorBySlot.get(slot)
          const drawn = drawnBySlot.get(slot)
          tag.hidden = anchor === undefined || drawn === undefined
          if (anchor === undefined || drawn === undefined) continue

          tag.style.translate = `${Math.round(anchor.x)}px ${Math.round(anchor.y)}px`
          tag.style.opacity = String(
            Math.max(0, 1 - drawn.fall * TAG_FADE_PER_FALL)
          )
          tag.classList.toggle('is-absent', drawn.isAbsent)
          tag.classList.toggle(
            'is-recharging',
            !drawn.isAbsent && drawn.isDashRecharging
          )
        }
      }
    }),
    []
  )

  return (
    <div aria-hidden='true' className='top-tags'>
      {seats.map(({ seatId, slot }) => (
        <div
          className='top-tag'
          hidden
          key={seatId}
          ref={(tag) => {
            if (tag === null) {
              tags.current.delete(slot)
            } else {
              tags.current.set(slot, tag)
            }
          }}
        >
          <span className='top-tag-plate'>
            <SeatTop className='top-tag-top' slot={slot} />
            {translate(seatNameKey(slot))}
          </span>
          <span className='top-tag-stem' />
        </div>
      ))}
    </div>
  )
}
