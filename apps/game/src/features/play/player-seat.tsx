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
import { createEventChannel } from '@/helpers/event-channel'
import { useRoomSocket } from '@/infrastructure/messaging/use-room-socket'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import type { PlainTranslationKey } from '@/presentation/i18n/translation'

import { usePlayerSessionId } from './use-player-session-id'

const refusalMessage = {
  hello_required: 'play.refused.unexpected',
  internal_error: 'play.refused.unexpected',
  invalid_message: 'play.refused.unexpected',
  protocol_version_mismatch: 'play.refused.outdated',
  room_closed: 'play.refused.roomGone',
  room_full: 'play.refused.roomFull',
  room_not_found: 'play.refused.roomGone',
  screen_replaced: 'play.refused.unexpected',
  screen_token_invalid: 'play.refused.unexpected',
  wrong_role: 'play.refused.unexpected'
} satisfies Record<ProtocolErrorCode, PlainTranslationKey>

type PlayerSeatProps = {
  roomCode: RoomCode
}

/** A phone seated in the room: its place, then the game's controller. */
export const PlayerSeat: React.FC<PlayerSeatProps> = ({ roomCode }) => {
  const translate = useTranslate()
  const sessionId = usePlayerSessionId()
  const [roomView, setRoomView] = useState<PlayerRoomMessage | null>(null)
  const [gameEvents] = useState(createEventChannel<PlayerGameEvent>)
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
    return <p>{translate(refusalMessage[socket.status.code])}</p>
  }

  const ownSeat = roomView?.seats.find((seat) => seat.seatId === roomView.youId)

  if (roomView === null || ownSeat === undefined) {
    return null
  }

  return (
    <>
      <p>{translate('seat.present', { number: String(ownSeat.slot + 1) })}</p>
      {socket.status.kind === 'reconnecting' && (
        <p>{translate('play.reconnecting')}</p>
      )}
      <Suspense fallback={null}>
        <game.Controller
          events={gameEvents}
          room={roomView}
          send={socket.send}
        />
      </Suspense>
    </>
  )
}
