import type React from 'react'

import type { SeatId } from '@parallax/protocol/identifiers'
import type { SeatSlot } from '@parallax/protocol/room'
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

/** One seat's standing while a game runs, drawn on the room's roster. */
export type SeatStanding = {
  /** Out of the current round: struck through on the roster. */
  readonly isOut: boolean
  /** Won the match: its place is ringed in brass. */
  readonly isWinner: boolean
  /** Rounds won so far, out of the game's `goal`. */
  readonly score: number
}

/** A moment the whole room reads, across the display's header: who it concerns, and what happened. */
export type SceneAnnouncement = {
  readonly message: string
  readonly slots: readonly SeatSlot[]
}

/**
 * What a running game tells the room's shell, already in the room's language:
 * the play header, each seat's standing, and the announcement of the moment.
 * The shell draws them; it knows nothing of the game's rules.
 */
export type SceneStandings = {
  readonly announcement: SceneAnnouncement | null
  /** The roster's line while the game runs, e.g. "First to 3 rounds". */
  readonly cue: string
  /** The score that wins, one pip each on the roster. */
  readonly goal: number
  /** Seats playing the current round; the others show as waiting. */
  readonly seats: ReadonlyMap<SeatId, SeatStanding>
  /** Under the title, e.g. "3 in play". */
  readonly subtitle: string
  /** The play header's title, e.g. "Round 2". */
  readonly title: string
}

export type GameSceneProps = {
  events: EventSubscription<ScreenGameEvent>
  /** Called when the standings change; `null` while the game waits for players. */
  onStandings: (standings: SceneStandings | null) => void
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
