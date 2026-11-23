import { Result } from '@adrienlcp/result'
import ReconnectingWebSocket from 'partysocket/ws'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import type { z } from 'zod'

import {
  type ClientMessage,
  type Credentials,
  clientMessageSchema
} from '@parallax/protocol/client-message'
import { decodeMessage, encodeChecked } from '@parallax/protocol/codec'
import type { ProtocolErrorCode } from '@parallax/protocol/error-code'
import type { RoomCode } from '@parallax/protocol/identifiers'
import { fillRoute, ROOM_SOCKET_ROUTE } from '@parallax/protocol/routes'
import {
  type ErrorMessage,
  replyMessageSchema
} from '@parallax/protocol/server-message'
import { PROTOCOL_VERSION } from '@parallax/protocol/version'

import { sameHostSocketUrl } from '@/infrastructure/browser'
import { warnOnFailure } from '@/infrastructure/diagnostics'

/**
 * - `connecting` — the first attempt, before the socket ever opened
 * - `open` — connected; `hello` is sent on every opening
 * - `reconnecting` — the connection dropped, a retry is on its way
 * - `refused` — the server answered a fatal error: no more retries
 */
export type RoomSocketStatus =
  | { kind: 'connecting' }
  | { kind: 'open' }
  | { kind: 'reconnecting' }
  | { code: ProtocolErrorCode; kind: 'refused' }

type UseRoomSocketOptions<TEvent> = {
  credentials: Credentials
  /** The role's events, never the replies, which the socket handles itself. */
  eventSchema: z.ZodType<TEvent>
  onEvent: (event: TEvent) => void
  roomCode: RoomCode
}

export type RoomSocket = {
  /** Transmitted only while open: a stick sent during a drop would arrive stale, so it is dropped. */
  send: (message: ClientMessage) => boolean
  status: RoomSocketStatus
}

/** A silent socket gets one ping; a second ping with no frame in between reconnects it. */
const PING_INTERVAL_MS = 5000
/** Spread so that every phone of a room does not knock again at the same instant. */
const FIRST_RETRY_MS = 500
const FIRST_RETRY_JITTER_MS = 1000
const LONGEST_RETRY_MS = 5000

const CONNECTING: RoomSocketStatus = { kind: 'connecting' }

const connectToRoom = (roomCode: RoomCode): ReconnectingWebSocket =>
  new ReconnectingWebSocket(
    sameHostSocketUrl(fillRoute(ROOM_SOCKET_ROUTE, { code: roomCode })),
    undefined,
    {
      maxEnqueuedMessages: 0,
      maxReconnectionDelay: LONGEST_RETRY_MS,
      minReconnectionDelay:
        FIRST_RETRY_MS + Math.random() * FIRST_RETRY_JITTER_MS
    }
  )

/**
 * The room's socket for one role: says `hello` on every opening, keeps the
 * connection alive with pings, reconnects through drops, and stops for good on
 * a fatal error. A new `roomCode` opens a new socket.
 */
export const useRoomSocket = <TEvent>({
  credentials,
  eventSchema,
  onEvent,
  roomCode
}: UseRoomSocketOptions<TEvent>): RoomSocket => {
  const socketRef = useRef<ReconnectingWebSocket | null>(null)
  const [reported, setReported] = useState<{
    roomCode: RoomCode
    status: RoomSocketStatus
  } | null>(null)

  const helloFrame = useEffectEvent(() =>
    encodeChecked(clientMessageSchema, {
      credentials,
      protocolVersion: PROTOCOL_VERSION,
      type: 'hello'
    })
  )

  const deliverEvent = useEffectEvent((raw: string) => {
    const decoded = decodeMessage(eventSchema, raw)

    if (decoded.status === 'failure') {
      warnOnFailure(Result.failure(decoded.reason), 'Reading a room frame')
      return
    }

    onEvent(decoded.message)
  })

  useEffect(() => {
    const socket = connectToRoom(roomCode)
    let isAwaitingPong = false
    let isFinished = false

    const report = (status: RoomSocketStatus) => {
      if (!isFinished) {
        setReported({ roomCode, status })
      }
    }

    const refuse = (error: ErrorMessage) => {
      report({ code: error.code, kind: 'refused' })
      isFinished = true
      socket.close()
    }

    const handleOpen = () => {
      isAwaitingPong = false
      socket.send(helloFrame())
      report({ kind: 'open' })
    }

    const handleClose = () => report({ kind: 'reconnecting' })

    const handleFrame = (event: MessageEvent<unknown>) => {
      isAwaitingPong = false

      if (typeof event.data !== 'string') {
        return
      }

      const reply = decodeMessage(replyMessageSchema, event.data)

      if (reply.status === 'failure') {
        deliverEvent(event.data)
        return
      }

      if (reply.message.type !== 'error') {
        return
      }

      if (reply.message.isFatal) {
        refuse(reply.message)
        return
      }

      warnOnFailure(Result.failure(reply.message.code), 'A room frame we sent')
    }

    const pingOrRevive = () => {
      if (socket.readyState !== socket.OPEN) {
        return
      }

      if (isAwaitingPong) {
        isAwaitingPong = false
        socket.reconnect()
        return
      }

      isAwaitingPong = true
      socket.send(encodeChecked(clientMessageSchema, { type: 'ping' }))
    }

    socket.addEventListener('open', handleOpen)
    socket.addEventListener('close', handleClose)
    socket.addEventListener('message', handleFrame)
    const pingTimer = setInterval(pingOrRevive, PING_INTERVAL_MS)
    socketRef.current = socket

    return () => {
      isFinished = true
      clearInterval(pingTimer)
      socket.close()
      socketRef.current = null
    }
  }, [roomCode])

  const send = (message: ClientMessage): boolean =>
    socketRef.current?.send(encodeChecked(clientMessageSchema, message)) ??
    false

  return {
    send,
    status: reported?.roomCode === roomCode ? reported.status : CONNECTING
  }
}
