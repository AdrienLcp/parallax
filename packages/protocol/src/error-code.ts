import { z } from 'zod'

export const protocolErrorCodes = [
  'room_not_found',
  'room_full',
  /** The room went unused for its lifetime and was erased. Fatal. */
  'room_closed',
  'invalid_message',
  'protocol_version_mismatch',
  /** A frame other than `hello` or `ping` before the socket said who it is. Fatal. */
  'hello_required',
  /** A screen `hello` without the token the room was opened with. Fatal. */
  'screen_token_invalid',
  /** Another tab or device took the screen over. Fatal for the one it replaced. */
  'screen_replaced',
  /** A frame the sender's role never sends: a phone's state, a screen's stick. */
  'wrong_role',
  /** A frame the room's phase does not take, such as a game change mid-game. */
  'wrong_phase',
  /** The screen removed this phone's seat. Fatal. */
  'seat_removed',
  /** This phone gave its seat back. Fatal. */
  'seat_left',
  'internal_error'
] as const

export const protocolErrorCodeSchema = z.enum(protocolErrorCodes)

export type ProtocolErrorCode = z.infer<typeof protocolErrorCodeSchema>
