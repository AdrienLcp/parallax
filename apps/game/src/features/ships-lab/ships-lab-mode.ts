import { generatePath, useParams } from 'react-router'

import { type RoomCode, roomCodeSchema } from '@parallax/protocol/identifiers'

import { paths } from '@/infrastructure/router/navigation'

import type { FlightMode } from './ships-lab-flight'

export const FLIGHT_MODES = [
  'screen',
  'pilot',
  'gyro',
  'auto',
  'depth'
] as const satisfies readonly FlightMode[]

const isFlightMode = (value: string | undefined): value is FlightMode =>
  FLIGHT_MODES.some((mode) => mode === value)

/** The flight mode the address names, or `null`. */
export const useFlightModeParam = (): FlightMode | null => {
  const { mode } = useParams()
  return isFlightMode(mode) ? mode : null
}

/** The room the pad's address names, or `null`. */
export const useLabRoomCodeParam = (): RoomCode | null => {
  const parsed = roomCodeSchema.safeParse(useParams().roomCode)
  return parsed.success ? parsed.data : null
}

export const labScreenPathFor = (mode: FlightMode): string =>
  generatePath(paths.shipsLabScreen, { mode })

export const labPadPathFor = (mode: FlightMode, roomCode: RoomCode): string =>
  generatePath(paths.shipsLabPad, { mode, roomCode })

/** The lab's screen pages draw the alcove unless they run on the unit, which shows the real one. */
export const UNIT_PARAM = 'unit'
