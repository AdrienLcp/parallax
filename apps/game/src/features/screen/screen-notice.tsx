import type React from 'react'

import { Button } from '@/presentation/components/button'

import './screen-notice.sass'

type ScreenNoticeProps = {
  /** The verb on the one way out: "Retry", "Take back". */
  action: string
  /** What went wrong, read from across the room. */
  message: string
  onAction: () => void
}

/** The display when it has no room to show: what happened, and the way back. */
export const ScreenNotice: React.FC<ScreenNoticeProps> = ({
  action,
  message,
  onAction
}) => (
  <div className='screen-notice'>
    <h1 className='notice-message'>{message}</h1>
    <Button className='notice-action' onPress={onAction}>
      {action}
    </Button>
  </div>
)
