import { generatePath, type PathParam, useParams } from 'react-router'

import { type RoomCode, roomCodeSchema } from '@parallax/protocol/identifiers'

export const paths = {
  home: '/',
  legal: '/legal',
  play: '/play/:roomCode',
  screen: '/screen'
} as const

const pathFor = <TPath extends string>(
  path: TPath,
  params: Record<PathParam<TPath>, string>
): string => generatePath<string>(path, params)

/** Where a phone joins the room: what the screen's code points to. */
export const playPathFor = (roomCode: RoomCode): string =>
  pathFor(paths.play, { roomCode })

/** The room a phone was sent to, or `null` when the address holds no valid code. */
export const useRoomCodeParam = (): RoomCode | null => {
  const { roomCode } = useParams<PathParam<typeof paths.play>>()
  const parsed = roomCodeSchema.safeParse(roomCode)

  return parsed.success ? parsed.data : null
}
