import type React from 'react'
import { Suspense, useEffect, useEffectEvent, useState } from 'react'

import type { ProtocolErrorCode } from '@parallax/protocol/error-code'
import type { CreateRoomResponse } from '@parallax/protocol/http'
import {
  type ScreenRoomMessage,
  screenEventSchema
} from '@parallax/protocol/server-message'

import type {
  SceneStandings,
  ScreenGameEvent
} from '@/features/games/game-definition'
import { CURRENT_GAME, games } from '@/features/games/games'
import { createEventChannel } from '@/helpers/event-channel'
import { reloadPage } from '@/infrastructure/browser'
import { useRoomSocket } from '@/infrastructure/messaging/use-room-socket'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { AnnouncementBand } from './announcement-band'
import { PlayHeader } from './play-header'
import { RoomJoin } from './room-join'
import { ScreenNotice } from './screen-notice'
import { SeatRoster } from './seat-roster'

import './screen-room.sass'

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

/** The room on the display: how to join it or how the game stands, the arena the game plays on, and its seats. */
export const ScreenRoom: React.FC<ScreenRoomProps> = ({ onRoomLost, room }) => {
  const translate = useTranslate()
  const [roomView, setRoomView] = useState<ScreenRoomMessage | null>(null)
  const [gameEvents] = useState(createEventChannel<ScreenGameEvent>)
  const [standings, setStandings] = useState<SceneStandings | null>(null)
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
      <ScreenNotice
        action={translate('screen.takeBack')}
        message={translate(
          socket.status.code === 'screen_replaced'
            ? 'screen.replaced'
            : 'screen.refused'
        )}
        onAction={reloadPage}
      />
    )
  }

  return (
    <div className='screen-room'>
      <div className='screen-head'>
        {standings === null ? (
          <RoomJoin code={room.code} />
        ) : (
          <PlayHeader
            code={room.code}
            subtitle={standings.subtitle}
            title={standings.title}
          />
        )}
        <AnnouncementBand announcement={standings?.announcement ?? null} />
      </div>
      <div className='arena'>
        {roomView === null ? (
          <game.Preview />
        ) : (
          <Suspense fallback={<game.Preview />}>
            <game.Scene
              events={gameEvents}
              onStandings={setStandings}
              room={roomView}
              send={socket.send}
            />
          </Suspense>
        )}
        {socket.status.kind === 'reconnecting' && (
          <p className='screen-reconnecting' role='status'>
            {translate('screen.reconnecting')}
          </p>
        )}
      </div>
      <SeatRoster seats={roomView?.seats ?? []} standings={standings} />
    </div>
  )
}
