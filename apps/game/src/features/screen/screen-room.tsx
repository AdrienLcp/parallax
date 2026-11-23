import type React from 'react'
import { Suspense, useEffect, useEffectEvent, useState } from 'react'

import type { ProtocolErrorCode } from '@parallax/protocol/error-code'
import type { CreateRoomResponse } from '@parallax/protocol/http'
import {
  type ScreenRoomMessage,
  screenEventSchema
} from '@parallax/protocol/server-message'

import type { ScreenGameEvent } from '@/features/games/game-definition'
import { CURRENT_GAME, games } from '@/features/games/games'
import { createEventChannel } from '@/helpers/event-channel'
import { reloadPage, sameOriginUrl } from '@/infrastructure/browser'
import { useRoomSocket } from '@/infrastructure/messaging/use-room-socket'
import { playPathFor } from '@/infrastructure/router/navigation'
import { Button } from '@/presentation/components/button'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

/** Refusals that mean the room is gone for this display: it opens another. */
const ROOM_LOST_CODES: ReadonlySet<ProtocolErrorCode> = new Set([
  'room_closed',
  'room_not_found',
  'screen_token_invalid'
])

type ScreenRoomProps = {
  /** Called once the server no longer holds this room for this display. */
  onRoomLost: () => void
  room: CreateRoomResponse
}

/** The room on the screen: the address to join it, its seats, and the game. */
export const ScreenRoom: React.FC<ScreenRoomProps> = ({ onRoomLost, room }) => {
  const translate = useTranslate()
  const [roomView, setRoomView] = useState<ScreenRoomMessage | null>(null)
  const [gameEvents] = useState(createEventChannel<ScreenGameEvent>)
  const game = games[CURRENT_GAME]

  const socket = useRoomSocket({
    credentials: { role: 'screen', screenToken: room.screenToken },
    eventSchema: screenEventSchema,
    onEvent: (event) => {
      if (event.type === 'room.updated') {
        setRoomView(event)
      } else {
        gameEvents.publish(event)
      }
    },
    roomCode: room.code
  })

  const isRoomLost =
    socket.status.kind === 'refused' && ROOM_LOST_CODES.has(socket.status.code)
  const leaveLostRoom = useEffectEvent(onRoomLost)

  useEffect(() => {
    if (isRoomLost) {
      leaveLostRoom()
    }
  }, [isRoomLost])

  if (socket.status.kind === 'refused') {
    return isRoomLost ? null : (
      <>
        <p>
          {translate(
            socket.status.code === 'screen_replaced'
              ? 'screen.replaced'
              : 'screen.refused'
          )}
        </p>
        <Button onPress={reloadPage}>{translate('screen.takeBack')}</Button>
      </>
    )
  }

  return (
    <>
      <p>{room.code}</p>
      <p>{sameOriginUrl(playPathFor(room.code))}</p>
      {socket.status.kind === 'reconnecting' && (
        <p>{translate('screen.reconnecting')}</p>
      )}
      {roomView !== null && (
        <>
          <ul>
            {roomView.seats.map((seat) => (
              <li key={seat.seatId}>
                {translate(seat.isConnected ? 'seat.present' : 'seat.away', {
                  number: String(seat.slot + 1)
                })}
              </li>
            ))}
          </ul>
          <Suspense fallback={null}>
            <game.Scene
              events={gameEvents}
              room={roomView}
              send={socket.send}
            />
          </Suspense>
        </>
      )}
    </>
  )
}
