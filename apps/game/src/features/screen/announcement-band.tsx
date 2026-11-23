import type React from 'react'
import { useEffect, useRef, useState } from 'react'

import type { SceneAnnouncement } from '@/features/games/game-definition'
import { SeatTop } from '@/features/room/seat-top'

import './announcement-band.sass'

const settled = (animations: readonly Animation[]): Promise<unknown> =>
  Promise.allSettled(animations.map((animation) => animation.finished))

type AnnouncementBandProps = {
  /** The moment to read; `null` wipes the band off. */
  announcement: SceneAnnouncement | null
}

/**
 * The slate band with brass filets that wipes across the display's header when
 * the game has news for the whole room — a fall, a round, a match. One band:
 * new news replaces the text in place.
 */
export const AnnouncementBand: React.FC<AnnouncementBandProps> = ({
  announcement
}) => {
  const band = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(announcement)
  const isLeaving = announcement === null && shown !== null

  if (announcement !== null && announcement !== shown) {
    setShown(announcement)
  }

  useEffect(() => {
    if (!isLeaving || band.current === null) {
      return
    }

    let isCurrent = true

    void settled(band.current.getAnimations()).then(() => {
      if (isCurrent) {
        setShown(null)
      }
    })

    return () => {
      isCurrent = false
    }
  }, [isLeaving])

  if (shown === null) {
    return null
  }

  return (
    <div
      aria-live='polite'
      className='announcement-band'
      data-exiting={isLeaving ? '' : undefined}
      ref={band}
    >
      {shown.slots.length > 0 && (
        <span className='announced-tops'>
          {shown.slots.map((slot) => (
            <SeatTop className='announced-top' key={slot} slot={slot} />
          ))}
        </span>
      )}
      <p className='announcement-message'>{shown.message}</p>
    </div>
  )
}
