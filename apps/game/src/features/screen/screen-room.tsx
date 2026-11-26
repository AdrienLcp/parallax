import type React from 'react'
import { Suspense, useEffect, useEffectEvent, useRef, useState } from 'react'
import { useNavigate } from 'react-router'

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
import { DEFAULT_GAME_ID, type GameId, games } from '@/features/games/games'
import { type MusicMood, useDisplaySound } from '@/features/sound/display-sound'
import { createEventChannel } from '@/helpers/event-channel'
import { reloadPage } from '@/infrastructure/browser'
import { useRoomSocket } from '@/infrastructure/messaging/use-room-socket'
import { homePathFor, paths } from '@/infrastructure/router/navigation'
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
  /** The game picked on the game choice, asked of the room once on arrival; `null` to play on. */
  askedGame: GameId | null
  /** Called with the game the room plays, whenever it changes. */
  onGame: (game: GameId) => void
  /** Called once the server no longer holds this room for this display. */
  onRoomLost: () => void
  room: CreateRoomResponse
}

/** The room on the display: how to join it or how the game stands, the arena the game plays on, and its seats. */
export const ScreenRoom: React.FC<ScreenRoomProps> = ({
  askedGame,
  onGame,
  onRoomLost,
  room
}) => {
  const translate = useTranslate()
  const navigate = useNavigate()
  const [roomView, setRoomView] = useState<ScreenRoomMessage | null>(null)
  const [gameEvents] = useState(createEventChannel<ScreenGameEvent>)
  const [standings, setStandings] = useState<SceneStandings | null>(null)
  /** Bumped when the display stops a game: the scene starts over, gathering. */
  const [sceneRun, setSceneRun] = useState(0)
  const isGameAsked = useRef(askedGame !== null)
  const gameId = roomView?.game ?? askedGame ?? DEFAULT_GAME_ID
  const game = games[gameId]
  const { sound } = useDisplaySound()
  const mood: MusicMood =
    standings !== null
      ? 'playing'
      : roomView?.seats.some((seat) => seat.isConnected)
        ? 'gathering'
        : 'resting'

  useEffect(() => {
    sound.setMood(mood)
  }, [mood, sound])

  useEffect(() => () => sound.setMood('resting'), [sound])

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

  const tellGame = useEffectEvent(onGame)

  useEffect(() => {
    tellGame(gameId)
  }, [gameId])

  // The game choice sent this display back to its room with a game: asked once,
  // then the address forgets it, so a reload never undoes a phone's later pick.
  useEffect(() => {
    if (roomView === null || !isGameAsked.current) {
      return
    }

    isGameAsked.current = false
    void navigate(paths.screen, { replace: true })

    if (
      askedGame !== null &&
      roomView.game !== askedGame &&
      roomView.phase === 'lobby'
    ) {
      socket.send({ game: askedGame, type: 'room.game' })
    }
  }, [askedGame, navigate, roomView, socket])

  const stopGame = () => {
    socket.send({ type: 'game.ended' })
    setStandings(null)
    setSceneRun((run) => run + 1)
  }

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
          <RoomJoin code={room.code} game={gameId} />
        ) : (
          <PlayHeader
            code={room.code}
            countdown={standings.countdown}
            subtitle={standings.subtitle}
            title={standings.title}
            titleSlot={standings.titleSlot}
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
              key={`${gameId}-${sceneRun}`}
              onStandings={setStandings}
              room={roomView}
              send={socket.send}
              sound={sound}
            />
          </Suspense>
        )}
        {socket.status.kind === 'reconnecting' && (
          <p className='screen-reconnecting' role='status'>
            {translate('screen.reconnecting')}
          </p>
        )}
      </div>
      <SeatRoster
        game={gameId}
        isPlaying={roomView?.phase === 'playing'}
        onKick={(seatId) => socket.send({ seatId, type: 'seat.kick' })}
        onLeave={() => void navigate(homePathFor(gameId))}
        onStop={stopGame}
        seats={roomView?.seats ?? []}
        standings={standings}
      />
    </div>
  )
}
