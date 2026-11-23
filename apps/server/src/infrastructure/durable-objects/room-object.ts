import { DurableObject } from 'cloudflare:workers'
import type { Result } from '@adrienlcp/result'
import { Hono } from 'hono'

import { encodeChecked } from '@parallax/protocol/codec'
import type { ProtocolErrorCode } from '@parallax/protocol/error-code'
import {
  type PlayerServerMessage,
  playerServerMessageSchema,
  replyMessageSchema,
  type ScreenServerMessage,
  screenServerMessageSchema
} from '@parallax/protocol/server-message'

import { type Admission, admissionSchema } from '@/domain/room/admission'
import type { OpenedRoom } from '@/domain/room/room'
import { roomErasureAtMs } from '@/domain/room/room-lifetime'
import { openRoom } from '@/domain/room/room-service'
import { handleFrame } from '@/domain/room/room-session'
import { createRoomStore, type RoomStore } from '@/domain/room/room-store'
import {
  playerRoomMessageOf,
  screenRoomMessageOf,
  seatsSeen
} from '@/domain/room/room-view'
import { nowMs } from '@/infrastructure/clock'
import { newSeatId } from '@/infrastructure/ids'

import { ROOM_OBJECT_MIGRATIONS } from './room-object-schema'
import { migrateSchema } from './schema-migrations'
import type { SqlDatabase } from './sql-database'

const POLICY_VIOLATION = 1008
const GOING_AWAY = 1001

const sqlDatabaseOf = (storage: DurableObjectStorage): SqlDatabase => ({
  run: (statement, ...bindings) =>
    storage.sql.exec(statement, ...bindings).toArray(),
  transaction: (work) => storage.transactionSync(work)
})

const admissionOf = (socket: WebSocket): Admission | null => {
  const parsed = admissionSchema.safeParse(socket.deserializeAttachment())

  return parsed.success ? parsed.data : null
}

const isOpen = (socket: WebSocket): boolean =>
  socket.readyState === WebSocket.READY_STATE_OPEN

/** A socket can close between the frame that woke the room and the answer. */
const sendFrame = (socket: WebSocket, frame: string): void => {
  if (isOpen(socket)) {
    socket.send(frame)
  }
}

const closeSocket = (socket: WebSocket, code: number, reason: string) => {
  if (isOpen(socket)) {
    socket.close(code, reason)
  }
}

const errorFrame = (code: ProtocolErrorCode) =>
  encodeChecked(replyMessageSchema, { code, isFatal: true, type: 'error' })

/**
 * One room: its seats, its screen and every phone in it. The phones' inputs
 * pass through to the screen, which runs the game; nothing of the game is
 * stored. Sockets go through the hibernation API, so a quiet room costs
 * nothing, and its alarm erases it once nobody has joined for a while.
 */
export class RoomObject extends DurableObject<Env> {
  private readonly store: RoomStore
  private readonly app = new Hono().get('*', (context) => {
    if (context.req.header('Upgrade') !== 'websocket') {
      return context.text('Expected a WebSocket', 426)
    }

    const { 0: client, 1: server } = new WebSocketPair()

    this.ctx.acceptWebSocket(server)

    return new Response(null, { status: 101, webSocket: client })
  })

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    const database = sqlDatabaseOf(ctx.storage)
    migrateSchema(database, ROOM_OBJECT_MIGRATIONS)
    this.store = createRoomStore(database)
  }

  async open(room: OpenedRoom): Promise<Result<void, 'already_open'>> {
    const opened = openRoom(this.store, room)

    if (opened.status === 'success') {
      await this.postponeErasure()
    }

    return opened
  }

  override alarm(): void {
    this.store.erase()

    for (const socket of this.ctx.getWebSockets()) {
      sendFrame(socket, errorFrame('room_closed'))
      closeSocket(socket, GOING_AWAY, 'room_closed')
    }
  }

  override fetch(request: Request): Response | Promise<Response> {
    return this.app.fetch(request)
  }

  override async webSocketMessage(
    socket: WebSocket,
    message: string | ArrayBuffer
  ): Promise<void> {
    const outcome = handleFrame({
      admission: admissionOf(socket),
      mintSeatId: newSeatId,
      raw: typeof message === 'string' ? message : '',
      store: this.store
    })

    socket.serializeAttachment(outcome.admission)

    if (outcome.reply !== null) {
      sendFrame(socket, encodeChecked(replyMessageSchema, outcome.reply))
    }

    if (outcome.shouldClose) {
      closeSocket(socket, POLICY_VIOLATION, 'refused')

      return
    }

    switch (outcome.event?.kind) {
      case 'admitted':
        await this.welcome(socket, outcome.admission)
        return
      case 'to_screen':
        this.sendToScreens(outcome.event.message)
        return
      case 'to_players':
        this.sendToPlayers(outcome.event.message)
        return
      case undefined:
        return
    }
  }

  override webSocketClose(socket: WebSocket): void {
    this.letRoomSeeLeave(socket)
  }

  override webSocketError(socket: WebSocket): void {
    this.letRoomSeeLeave(socket)
  }

  /** A newer screen takes over: a reloaded display must not wait on its half-dead socket. */
  private async welcome(
    socket: WebSocket,
    admission: Admission | null
  ): Promise<void> {
    if (admission?.role === 'screen') {
      for (const other of this.openSockets(socket)) {
        if (admissionOf(other)?.role === 'screen') {
          sendFrame(other, errorFrame('screen_replaced'))
          closeSocket(other, POLICY_VIOLATION, 'screen_replaced')
        }
      }
    }

    this.broadcastRoom(null)
    await this.postponeErasure()
  }

  private letRoomSeeLeave(socket: WebSocket): void {
    if (admissionOf(socket)?.role === 'player') {
      this.broadcastRoom(socket)
    }
  }

  /** The sockets still open, but for one that is leaving. */
  private openSockets(gone: WebSocket | null): WebSocket[] {
    return this.ctx
      .getWebSockets()
      .filter((socket) => socket !== gone && isOpen(socket))
  }

  private sendToScreens(message: ScreenServerMessage): void {
    const frame = encodeChecked(screenServerMessageSchema, message)

    for (const socket of this.openSockets(null)) {
      if (admissionOf(socket)?.role === 'screen') {
        sendFrame(socket, frame)
      }
    }
  }

  private sendToPlayers(message: PlayerServerMessage): void {
    const frame = encodeChecked(playerServerMessageSchema, message)

    for (const socket of this.openSockets(null)) {
      if (admissionOf(socket)?.role === 'player') {
        sendFrame(socket, frame)
      }
    }
  }

  /** Every admitted socket's fresh view of the room: a whole snapshot, never a delta. */
  private broadcastRoom(gone: WebSocket | null): void {
    const room = this.store.readRoom()

    if (room === null) {
      return
    }

    const admitted = this.openSockets(gone).map((socket) => ({
      admission: admissionOf(socket),
      socket
    }))
    const connectedSeatIds = new Set(
      admitted.flatMap(({ admission }) =>
        admission?.role === 'player' ? [admission.seatId] : []
      )
    )
    const seats = seatsSeen(this.store.readSeats(), connectedSeatIds)

    for (const { admission, socket } of admitted) {
      if (admission?.role === 'screen') {
        sendFrame(
          socket,
          encodeChecked(
            screenServerMessageSchema,
            screenRoomMessageOf({ room, seats })
          )
        )
      }

      if (admission?.role === 'player') {
        sendFrame(
          socket,
          encodeChecked(
            playerServerMessageSchema,
            playerRoomMessageOf({ room, seats, youId: admission.seatId })
          )
        )
      }
    }
  }

  private async postponeErasure(): Promise<void> {
    await this.ctx.storage.setAlarm(roomErasureAtMs(nowMs()))
  }
}
