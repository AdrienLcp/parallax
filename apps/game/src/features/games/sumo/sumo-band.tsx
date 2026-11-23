import type React from 'react'

import type { SeatSlot } from '@parallax/protocol/room'

import { seatNameKey } from '@/features/room/seat-name'
import { SeatTop } from '@/features/room/seat-top'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { RichText } from '@/presentation/i18n/rich-text'

import './sumo-band.sass'

type PushedByProps = {
  slot: SeatSlot
}

const PushedBy: React.FC<PushedByProps> = ({ slot }) => {
  const translate = useTranslate()

  const pusher = (children: string): React.ReactNode => (
    <span className='pusher'>
      <SeatTop className='pusher-top' slot={slot} />
      {children}
    </span>
  )

  return (
    <p className='band-detail'>
      <RichText
        parts={translate.rich('sumo.out.pushedBy', {
          name: translate(seatNameKey(slot)),
          seat: pusher
        })}
      />
    </p>
  )
}

type SumoBandProps = { slot: SeatSlot } & (
  | {
      outcome: 'out'
      /** The seat whose top pushed this one off, when the screen says so. */
      pushedBy?: SeatSlot
    }
  | { outcome: 'won' }
)

/**
 * The band that wipes across the phone when its round ends: slate between
 * brass filets for the gutter, brass for the win. The display shows the same
 * band to the whole room.
 */
export const SumoBand: React.FC<SumoBandProps> = (props) => {
  const translate = useTranslate()

  return (
    <div className='sumo-band' data-outcome={props.outcome}>
      <SeatTop className='band-top' slot={props.slot} />
      {props.outcome === 'out' ? (
        <div>
          <p className='band-title'>{translate('sumo.out.title')}</p>
          {props.pushedBy !== undefined && <PushedBy slot={props.pushedBy} />}
        </div>
      ) : (
        <div>
          <p className='band-title'>{translate('sumo.won.title')}</p>
          <p className='band-detail'>{translate('sumo.won.detail')}</p>
        </div>
      )}
    </div>
  )
}
