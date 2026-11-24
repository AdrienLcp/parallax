import type React from 'react'
import { Suspense, useState } from 'react'

import type { ProtocolErrorCode } from '@parallax/protocol/error-code'
import type { RoomCode } from '@parallax/protocol/identifiers'
import {
  type PlayerRoomMessage,
  playerEventSchema
} from '@parallax/protocol/server-message'

import type { PlayerGameEvent } from '@/features/games/game-definition'
import { CURRENT_GAME, games } from '@/features/games/games'
import { createReplayingEventChannel } from '@/helpers/event-channel'
import { paintBrowserBarBehind } from '@/infrastructure/browser'
import { useRoomSocket } from '@/infrastructure/messaging/use-room-socket'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import type { PlainTranslationKey } from '@/presentation/i18n/translation'

import { RoomNotice } from './room-notice'
import { Spinner } from './spinner'
import { usePlayerSessionId } from './use-player-session-id'

import './player-seat.sass'

type Refusal = {
  canRetry: boolean
  reason: PlainTranslationKey
}

const UNEXPECTED: Refusal = {
  canRetry: true,
  reason: 'play.refused.unexpected'
}
const ROOM_GONE: Refusal = { canRetry: false, reason: 'play.refused.roomGone' }

const refusals = {
  hello_required: UNEXPECTED,
  internal_error: UNEXPECTED,
  invalid_message: UNEXPECTED,
  protocol_version_mismatch: {
    canRetry: true,
    reason: 'play.refused.outdated'
  },
  room_closed: ROOM_GONE,
  room_full: { canRetry: true, reason: 'play.refused.roomFull' },
  room_not_found: ROOM_GONE,
  screen_replaced: UNEXPECTED,
  screen_token_invalid: UNEXPECTED,
  wrong_role: UNEXPECTED
} satisfies Record<ProtocolErrorCode, Refusal>

type PlayerSeatProps = {
  roomCode: RoomCode
}

/** A phone seated in the room: its place, then the game's controller. */
export const PlayerSeat: React.FC<PlayerSeatProps> = ({ roomCode }) => {
  const translate = useTranslate()
  const sessionId = usePlayerSessionId()
  const [roomView, setRoomView] = useState<PlayerRoomMessage | null>(null)
  const [gameEvents] = useState(createReplayingEventChannel<PlayerGameEvent>)
  const game = games[CURRENT_GAME]

  const socket = useRoomSocket({
    credentials: { role: 'player', sessionId },
    eventSchema: playerEventSchema,
    onEvent: (event) => {
      if (event.type === 'room.updated') {
        setRoomView(event)
      } else {
        gameEvents.publish(event)
      }
    },
    roomCode
  })

  if (socket.status.kind === 'refused') {
    return (
      <RoomNotice
        kind='refused'
        roomCode={roomCode}
        {...refusals[socket.status.code]}
      />
    )
  }

  const ownSeat = roomView?.seats.find((seat) => seat.seatId === roomView.youId)

  if (roomView === null || ownSeat === undefined) {
    return <RoomNotice kind='connecting' roomCode={roomCode} />
  }

  const isReconnecting = socket.status.kind === 'reconnecting'

  return (
    <div
      className='player-seat'
      data-seat-slot={ownSeat.slot}
      ref={paintBrowserBarBehind}
    >
      <div className='seat-controller' inert={isReconnecting}>
        <Suspense fallback={null}>
          <game.Controller
            events={gameEvents}
            room={roomView}
            send={socket.send}
          />
        </Suspense>
      </div>
      <div className='seat-connection' role='status'>
        {isReconnecting && (
          <p className='reconnecting-bubble'>
            <Spinner />
            {translate('play.reconnecting')}
          </p>
        )}
      </div>
    </div>
  )
}
