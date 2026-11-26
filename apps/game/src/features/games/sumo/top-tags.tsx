import type React from 'react'
import { useImperativeHandle, useRef } from 'react'

import type { Seat, SeatSlot } from '@parallax/protocol/room'

import { seatNameOf } from '@/features/room/seat-name'
import { SeatTop } from '@/features/room/seat-top'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import type { ArenaFrame } from './arena-frame'
import type { TagAnchor } from './arena-renderer'
import { liftTagsApart, type TagBox } from './tag-placement'

import './top-tags.sass'

/** A falling top's tag fades as it leaves the felt; the renderer drops its anchor past the edge. */
const TAG_FADE_PER_FALL = 2
/** The room kept between two stacked plates, as a share of a plate's height. */
const TAG_GAP_PER_PLATE_HEIGHT = 0.12

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
 * top's dash recharges. Tags never overlap: a farther top's tag climbs over a
 * nearer one's on a longer stem.
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
        const shown: { anchor: TagAnchor; tag: HTMLElement }[] = []

        for (const [slot, tag] of tags.current) {
          const anchor = anchorBySlot.get(slot)
          const drawn = drawnBySlot.get(slot)
          const opacity =
            drawn === undefined
              ? 0
              : Math.max(0, 1 - drawn.fall * TAG_FADE_PER_FALL)
          tag.hidden = anchor === undefined || opacity === 0
          if (anchor === undefined || drawn === undefined || opacity === 0) {
            continue
          }

          tag.style.opacity = String(opacity)
          tag.style.setProperty('--lift-px', '0px')
          tag.classList.toggle('is-absent', drawn.isAbsent)
          tag.classList.toggle(
            'is-recharging',
            !drawn.isAbsent && drawn.isDashRecharging
          )
          shown.push({ anchor, tag })
        }

        const boxes = shown.map(({ anchor, tag }): TagBox => {
          const plateHeight = tag.firstElementChild?.clientHeight ?? 0
          return {
            plateHeight,
            plateWidth: tag.firstElementChild?.clientWidth ?? 0,
            slot: anchor.slot,
            stemHeight: tag.offsetHeight - plateHeight,
            x: anchor.x,
            y: anchor.y
          }
        })
        const gap = (boxes[0]?.plateHeight ?? 0) * TAG_GAP_PER_PLATE_HEIGHT
        const lifts = liftTagsApart(boxes, gap)

        for (const { anchor, tag } of shown) {
          tag.style.setProperty(
            '--lift-px',
            `${Math.round(lifts.get(anchor.slot) ?? 0)}px`
          )
          tag.style.translate = `${Math.round(anchor.x)}px ${Math.round(anchor.y)}px`
        }
      }
    }),
    []
  )

  return (
    <div aria-hidden='true' className='top-tags'>
      {seats.map(({ name, seatId, slot }) => (
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
            {seatNameOf({ name, slot }, translate)}
          </span>
          <span className='top-tag-stem' />
        </div>
      ))}
    </div>
  )
}
