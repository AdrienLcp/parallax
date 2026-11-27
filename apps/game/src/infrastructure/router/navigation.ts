import {
  generatePath,
  type PathParam,
  useParams,
  useSearchParams
} from 'react-router'

import { type GameId, gameIdSchema } from '@parallax/protocol/games'
import { type RoomCode, roomCodeSchema } from '@parallax/protocol/identifiers'

export const paths = {
  home: '/',
  legal: '/legal',
  play: '/play/:roomCode',
  screen: '/screen',
  shipsLab: '/lab/ships',
  shipsLabPad: '/lab/ships/:mode/pad/:roomCode',
  shipsLabScreen: '/lab/ships/:mode'
} as const

const pathFor = <TPath extends string>(
  path: TPath,
  params: Record<PathParam<TPath>, string>
): string => generatePath<string>(path, params)

/** Where a phone joins the room: what the screen's code points to. */
export const playPathFor = (roomCode: RoomCode): string =>
  pathFor(paths.play, { roomCode })

const GAME_PARAM = 'game'

/** The game choice, showing this game first: where the display goes to change its room's game. */
export const homePathFor = (game: GameId): string =>
  `${paths.home}?${GAME_PARAM}=${game}`

/** The display's room, asked to play this game: where the game choice opens it. */
export const screenPathFor = (game: GameId): string =>
  `${paths.screen}?${GAME_PARAM}=${game}`

/** The game the address asks for, or `null` when it names none the app hosts. */
export const useGameParam = (): GameId | null => {
  const [params] = useSearchParams()
  const parsed = gameIdSchema.safeParse(params.get(GAME_PARAM))

  return parsed.success ? parsed.data : null
}

/** The room a phone was sent to, or `null` when the address holds no valid code. */
export const useRoomCodeParam = (): RoomCode | null => {
  const { roomCode } = useParams<PathParam<typeof paths.play>>()
  const parsed = roomCodeSchema.safeParse(roomCode)

  return parsed.success ? parsed.data : null
}
