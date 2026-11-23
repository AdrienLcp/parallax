import type React from 'react'

import type { SeatSlot } from '@parallax/protocol/room'

import { ScorePips } from '@/features/room/score-pips'
import { seatNameKey } from '@/features/room/seat-name'
import { SeatTop } from '@/features/room/seat-top'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { RichText } from '@/presentation/i18n/rich-text'

import { SUMO_TUNING } from './sumo-tuning'

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

type SumoBandProps = {
  /** The rounds this seat has won, the one just decided included. */
  score: number
  slot: SeatSlot
} & (
  | {
      outcome: 'out'
      /** The seat whose top pushed this one off, when the screen says so. */
      pushedBy?: SeatSlot
    }
  | { outcome: 'matchWon' | 'roundWon' }
)

/**
 * The band that wipes across the phone when its round ends: slate between
 * brass filets for the gutter, brass for a win, with the seat's tally under
 * the title. The display shows the same news to the whole room.
 */
export const SumoBand: React.FC<SumoBandProps> = (props) => {
  const translate = useTranslate()

  return (
    <div className='sumo-band' data-outcome={props.outcome}>
      <SeatTop className='band-top' slot={props.slot} />
      <div className='band-text'>
        {props.outcome === 'out' ? (
          <>
            <p className='band-title'>{translate('sumo.out.title')}</p>
            {props.pushedBy !== undefined && <PushedBy slot={props.pushedBy} />}
          </>
        ) : (
          <p className='band-title'>
            {translate(
              props.outcome === 'matchWon' ? 'sumo.won.match' : 'sumo.won.round'
            )}
          </p>
        )}
        <ScorePips
          className='band-score'
          goal={SUMO_TUNING.roundsToWin}
          score={props.score}
        />
      </div>
    </div>
  )
}
