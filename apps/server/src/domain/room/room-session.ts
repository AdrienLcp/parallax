import {
  type ClientMessage,
  clientMessageSchema,
  type HelloMessage
} from '@parallax/protocol/client-message'
import { decodeMessage } from '@parallax/protocol/codec'
import type { ProtocolErrorCode } from '@parallax/protocol/error-code'
import type { SeatId } from '@parallax/protocol/identifiers'
import type { ReplyMessage } from '@parallax/protocol/server-message'
import type {
  SumoSeatDash,
  SumoSeatStick,
  SumoState
} from '@parallax/protocol/sumo'
import { PROTOCOL_VERSION } from '@parallax/protocol/version'

import type { Admission } from './admission'
import { admit } from './room-service'
import type { RoomStore } from './room-store'

/** What a frame asks of the room beyond answering its sender. */
export type SessionEvent =
  | { kind: 'admitted' }
  | { kind: 'to_screen'; message: SumoSeatDash | SumoSeatStick }
  | { kind: 'to_players'; message: SumoState }

export type FrameOutcome = {
  /** The socket's admission after this frame, to keep on it. */
  admission: Admission | null
  event: SessionEvent | null
  reply: ReplyMessage | null
  shouldClose: boolean
}

type GameMessage = Exclude<ClientMessage, { type: 'hello' | 'ping' }>

const refused = ({
  admission,
  code,
  isFatal
}: {
  admission: Admission | null
  code: ProtocolErrorCode
  isFatal: boolean
}): FrameOutcome => ({
  admission,
  event: null,
  reply: { code, isFatal, type: 'error' },
  shouldClose: isFatal
})

const passed = (admission: Admission, event: SessionEvent): FrameOutcome => ({
  admission,
  event,
  reply: null,
  shouldClose: false
})

const greet = ({
  admission,
  hello,
  mintSeatId,
  store
}: {
  admission: Admission | null
  hello: HelloMessage
  mintSeatId: () => SeatId
  store: RoomStore
}): FrameOutcome => {
  if (admission !== null) {
    return refused({ admission, code: 'invalid_message', isFatal: false })
  }

  if (hello.protocolVersion !== PROTOCOL_VERSION) {
    return refused({
      admission: null,
      code: 'protocol_version_mismatch',
      isFatal: true
    })
  }

  const admitted = admit({ credentials: hello.credentials, mintSeatId, store })

  if (admitted.status === 'failure') {
    return refused({ admission: null, code: admitted.error, isFatal: true })
  }

  return passed(admitted.data, { kind: 'admitted' })
}

/** The phones drive, the screen reports: each frame belongs to one role. */
const play = (admission: Admission, message: GameMessage): FrameOutcome => {
  switch (message.type) {
    case 'sumo.dash':
    case 'sumo.stick':
      return admission.role === 'player'
        ? passed(admission, {
            kind: 'to_screen',
            message: { ...message, seatId: admission.seatId }
          })
        : refused({ admission, code: 'wrong_role', isFatal: false })
    case 'sumo.state':
      return admission.role === 'screen'
        ? passed(admission, { kind: 'to_players', message })
        : refused({ admission, code: 'wrong_role', isFatal: false })
  }
}

/** One frame from one socket, decided without touching the socket. */
export const handleFrame = ({
  admission,
  mintSeatId,
  raw,
  store
}: {
  admission: Admission | null
  mintSeatId: () => SeatId
  raw: string
  store: RoomStore
}): FrameOutcome => {
  const decoded = decodeMessage(clientMessageSchema, raw)

  if (decoded.status === 'failure') {
    return refused({ admission, code: 'invalid_message', isFatal: false })
  }

  const { message } = decoded

  switch (message.type) {
    case 'ping':
      return {
        admission,
        event: null,
        reply: { type: 'pong' },
        shouldClose: false
      }
    case 'hello':
      return greet({ admission, hello: message, mintSeatId, store })
    default:
      return admission === null
        ? refused({ admission, code: 'hello_required', isFatal: true })
        : play(admission, message)
  }
}
