import type React from 'react'

import type { RoomCode } from '@parallax/protocol/identifiers'

import { reloadPage } from '@/infrastructure/browser'
import { Button } from '@/presentation/components/button'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import type { PlainTranslationKey } from '@/presentation/i18n/translation'

import { Spinner } from './spinner'

import './room-notice.sass'

type RoomNoticeProps = {
  /** The room's plaque, above the notice; `null` when the address holds no code. */
  roomCode: RoomCode | null
} & (
  | { kind: 'connecting' }
  | {
      kind: 'refused'
      reason: PlainTranslationKey
      /** Whether a fresh attempt may get in: a full room may free a seat, a closed one never reopens. */
      canRetry: boolean
    }
)

/** What a phone shows on the felt before it holds a seat: joining, or turned away. */
export const RoomNotice: React.FC<RoomNoticeProps> = (props) => {
  const translate = useTranslate()

  return (
    <section className='room-notice'>
      {props.roomCode !== null && (
        <p className='room-plaque'>
          <span className='plaque-label'>{translate('play.room')} </span>
          {props.roomCode}
        </p>
      )}
      {props.kind === 'connecting' ? (
        <p className='notice-status' role='status'>
          <Spinner />
          {translate('play.connecting')}
        </p>
      ) : (
        <>
          <h1 className='notice-headline'>{translate(props.reason)}</h1>
          {props.canRetry && (
            <Button className='notice-retry' onPress={reloadPage}>
              {translate('play.retry')}
            </Button>
          )}
        </>
      )}
    </section>
  )
}
