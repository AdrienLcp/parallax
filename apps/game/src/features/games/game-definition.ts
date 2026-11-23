import type React from 'react'

import type {
  PlayerEvent,
  PlayerRoomMessage,
  ScreenEvent,
  ScreenRoomMessage
} from '@parallax/protocol/server-message'

import type { EventSubscription } from '@/helpers/event-channel'
import type { RoomSocket } from '@/infrastructure/messaging/use-room-socket'
import type { PlainTranslationKey } from '@/presentation/i18n/translation'

/** What the screen hears about the game itself; the room's own updates stay with the page. */
export type ScreenGameEvent = Exclude<ScreenEvent, ScreenRoomMessage>

/** What a phone hears about the game itself; the room's own updates stay with the page. */
export type PlayerGameEvent = Exclude<PlayerEvent, PlayerRoomMessage>

export type GameSceneProps = {
  events: EventSubscription<ScreenGameEvent>
  room: ScreenRoomMessage
  send: RoomSocket['send']
}

export type GameControllerProps = {
  events: EventSubscription<PlayerGameEvent>
  room: PlayerRoomMessage
  send: RoomSocket['send']
}

/** One game the room can play: what each side draws, and who may play it. */
export type GameDefinition = {
  /** What a player holds, drawn on each phone of the room. */
  Controller: React.ComponentType<GameControllerProps>
  name: PlainTranslationKey
  /** Seated players the game needs to start, and the most it takes. */
  players: { fewest: number; most: number }
  /** What the room watches, drawn on the screen, which runs the game. */
  Scene: React.ComponentType<GameSceneProps>
}
