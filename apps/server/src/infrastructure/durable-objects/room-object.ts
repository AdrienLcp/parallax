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

import type { Admission } from '@/domain/room/admission'
import type { OpenedRoom } from '@/domain/room/room'
import { roomAlarmAtMs, roomErasureAtMs } from '@/domain/room/room-lifetime'
import { openRoom } from '@/domain/room/room-service'
import { handleFrame } from '@/domain/room/room-session'
import { createRoomStore, type RoomStore } from '@/domain/room/room-store'
import {
  playerRoomMessageOf,
  screenRoomMessageOf,
  seatsSeen
} from '@/domain/room/room-view'
import { absenceChanges, heldSeats } from '@/domain/room/seat-release'
import { isSilent } from '@/domain/room/socket-liveness'
import { nowMs } from '@/infrastructure/clock'
import { newSeatId } from '@/infrastructure/ids'

import { ROOM_OBJECT_MIGRATIONS } from './room-object-schema'
import { migrateSchema } from './schema-migrations'
import {
  type SocketAttachment,
  socketAttachmentSchema
} from './socket-attachment'
import type { SqlDatabase } from './sql-database'

const POLICY_VIOLATION = 1008
const GOING_AWAY = 1001

const sqlDatabaseOf = (storage: DurableObjectStorage): SqlDatabase => ({
  run: (statement, ...bindings) =>
    storage.sql.exec(statement, ...bindings).toArray(),
  transaction: (work) => storage.transactionSync(work)
})

const attachmentOf = (socket: WebSocket): SocketAttachment | null => {
  const parsed = socketAttachmentSchema.safeParse(
    socket.deserializeAttachment()
  )

  return parsed.success ? parsed.data : null
}

const admissionOf = (socket: WebSocket): Admission | null =>
  attachmentOf(socket)?.admission ?? null

const stampFrame = (socket: WebSocket, admission: Admission | null): void => {
  const attachment: SocketAttachment = { admission, lastFrameAtMs: nowMs() }

  socket.serializeAttachment(attachment)
}

const isOpen = (socket: WebSocket): boolean =>
  socket.readyState === WebSocket.READY_STATE_OPEN

/** Open by the runtime's account, yet quiet past the limit: the tab behind it is gone. */
const isSilentSocket = (socket: WebSocket, atMs: number): boolean => {
  const attachment = attachmentOf(socket)

  return (
    attachment === null ||
    isSilent({ lastFrameAtMs: attachment.lastFrameAtMs, nowMs: atMs })
  )
}

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

const RESERVED_CLOSE_CODES = new Set([1004, 1005, 1006, 1015])

/**
 * The runtime answers a phone's close frame itself, but not every local
 * workerd does: unanswered, the phone's socket stays closing and its
 * reconnection waits. Answering again is ignored where it already answered.
 */
const replyToClose = (socket: WebSocket, code: number, reason: string) => {
  if (socket.readyState === WebSocket.READY_STATE_CLOSED) {
    return
  }

  if (code >= 1000 && code < 5000 && !RESERVED_CLOSE_CODES.has(code)) {
    socket.close(code, reason)
  } else {
    socket.close()
  }
}

const errorFrame = (code: ProtocolErrorCode) =>
  encodeChecked(replyMessageSchema, { code, isFatal: true, type: 'error' })

/**
 * One room: its seats, its screen and every phone in it. The phones' inputs
 * pass through to the screen, which runs the game; nothing of the game is
 * stored. Sockets go through the hibernation API, so a quiet room costs
 * nothing. Its one alarm shows a seat left empty for long enough as free,
 * and erases the room once nobody has joined for a while.
 */
export class RoomObject extends DurableObject<Env> {
  private readonly store: RoomStore
  private readonly app = new Hono().get('*', (context) => {
    if (context.req.header('Upgrade') !== 'websocket') {
      return context.text('Expected a WebSocket', 426)
    }

    const { 0: client, 1: server } = new WebSocketPair()

    this.ctx.acceptWebSocket(server)
    stampFrame(server, null)

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

  override async alarm(): Promise<void> {
    const erasureAtMs = this.store.readErasureAt()

    if (erasureAtMs === null || nowMs() >= erasureAtMs) {
      this.erase()

      return
    }

    await this.dropSilentSockets()
    await this.refreshRoom(null)
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
      nowMs: nowMs(),
      raw: typeof message === 'string' ? message : '',
      store: this.store
    })

    stampFrame(socket, outcome.admission)

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
      case 'pinged':
        await this.dropSilentSockets()
        return
      case 'seats_changed':
        await this.refreshRoom(null)
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

  override async webSocketClose(
    socket: WebSocket,
    code: number,
    reason: string
  ): Promise<void> {
    replyToClose(socket, code, reason)
    await this.letRoomSeeLeave(socket)
  }

  override async webSocketError(socket: WebSocket): Promise<void> {
    await this.letRoomSeeLeave(socket)
  }

  private erase(): void {
    this.store.erase()

    for (const socket of this.ctx.getWebSockets()) {
      sendFrame(socket, errorFrame('room_closed'))
      closeSocket(socket, GOING_AWAY, 'room_closed')
    }
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

    this.store.setErasureAt(roomErasureAtMs(nowMs()))
    await this.refreshRoom(null)
  }

  private async letRoomSeeLeave(socket: WebSocket): Promise<void> {
    if (admissionOf(socket)?.role === 'player') {
      await this.refreshRoom(socket)
    }
  }

  /**
   * A tab closed without a close frame leaves its socket open here for good.
   * Each ping, from any socket, is the moment to let the quiet ones go.
   */
  private async dropSilentSockets(): Promise<void> {
    const atMs = nowMs()
    const silent = this.ctx
      .getWebSockets()
      .filter((socket) => isOpen(socket) && isSilentSocket(socket, atMs))

    for (const socket of silent) {
      closeSocket(socket, GOING_AWAY, 'silent')
    }

    if (silent.some((socket) => admissionOf(socket)?.role === 'player')) {
      await this.refreshRoom(null)
    }
  }

  /** The sockets still open and speaking, but for one that is leaving. */
  private openSockets(gone: WebSocket | null): WebSocket[] {
    const atMs = nowMs()

    return this.ctx
      .getWebSockets()
      .filter(
        (socket) =>
          socket !== gone && isOpen(socket) && !isSilentSocket(socket, atMs)
      )
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

  /**
   * Notes which seats just lost or found their phone, sends every admitted
   * socket its fresh view of the room (a whole snapshot, never a delta), and
   * sets the alarm for whatever comes next.
   */
  private async refreshRoom(gone: WebSocket | null): Promise<void> {
    const room = this.store.readRoom()

    if (room === null) {
      return
    }

    const atMs = nowMs()
    const admitted = this.openSockets(gone).map((socket) => ({
      admission: admissionOf(socket),
      socket
    }))
    const connectedSeatIds = new Set(
      admitted.flatMap(({ admission }) =>
        admission?.role === 'player' ? [admission.seatId] : []
      )
    )
    this.store.recordAbsences(
      absenceChanges({
        connectedSeatIds,
        nowMs: atMs,
        seats: this.store.readSeats()
      })
    )
    const stored = this.store.readSeats()
    const seats = seatsSeen(heldSeats(stored, atMs), connectedSeatIds)

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

    await this.ctx.storage.setAlarm(
      roomAlarmAtMs({
        erasureAtMs: this.store.readErasureAt() ?? roomErasureAtMs(atMs),
        nowMs: atMs,
        seats: stored
      })
    )
  }

  private async postponeErasure(): Promise<void> {
    const erasureAtMs = roomErasureAtMs(nowMs())

    this.store.setErasureAt(erasureAtMs)
    await this.ctx.storage.setAlarm(erasureAtMs)
  }
}
