import type React from 'react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'

import type { SeatSlot } from '@parallax/protocol/room'

import { seatNameKey } from '@/features/room/seat-name'
import { SeatTop } from '@/features/room/seat-top'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './ejection-band.sass'

/** How long the band stays across the display before it wipes off: time to read it, not motion. */
const EJECTION_READING_MS = 2200

const settled = (animations: readonly Animation[]): Promise<unknown> =>
  Promise.allSettled(animations.map((animation) => animation.finished))

type EjectionBandProps = {
  /** Called once the band has wiped off the display: unmount it then. */
  onDone: () => void
  /** The seat that fell into the gutter. */
  slot: SeatSlot
}

/**
 * The slate band with brass filets that wipes across the display when a seat
 * falls: "Red in the gutter". Mount one per ejection, keyed by it, inside the
 * positioned arena area; it reads, wipes off, then calls `onDone`.
 */
export const EjectionBand: React.FC<EjectionBandProps> = ({ onDone, slot }) => {
  const translate = useTranslate()
  const band = useRef<HTMLDivElement>(null)
  const [isLeaving, setIsLeaving] = useState(false)
  const finish = useEffectEvent(onDone)

  useEffect(() => {
    const reading = setTimeout(() => setIsLeaving(true), EJECTION_READING_MS)

    return () => clearTimeout(reading)
  }, [])

  useEffect(() => {
    if (!isLeaving || band.current === null) {
      return
    }

    let isMounted = true

    void settled(band.current.getAnimations()).then(() => {
      if (isMounted) {
        finish()
      }
    })

    return () => {
      isMounted = false
    }
  }, [isLeaving])

  return (
    <div
      className='ejection-band'
      data-exiting={isLeaving ? '' : undefined}
      ref={band}
    >
      <SeatTop className='ejected-top' slot={slot} />
      <p className='ejection-message'>
        {translate('screen.ejected', { seat: translate(seatNameKey(slot)) })}
      </p>
    </div>
  )
}
