import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestHarness } from 'wrangler'

import type { Credentials } from '@parallax/protocol/client-message'
import {
  apiErrorResponseSchema,
  createRoomResponseSchema,
  healthResponseSchema
} from '@parallax/protocol/http'
import {
  API_ROUTES,
  fillRoute,
  ROOM_SOCKET_ROUTE
} from '@parallax/protocol/routes'
import { PROTOCOL_VERSION } from '@parallax/protocol/version'

const WORKERD_START_TIMEOUT_MS = 120_000
const FRAME_TIMEOUT_MS = 5000

mkdirSync(resolve(import.meta.dirname, '../../../../game/dist'), {
  recursive: true
})

const server = createTestHarness({
  workers: [
    { configPath: resolve(import.meta.dirname, '../../../wrangler.jsonc') }
  ]
})

const openRoom = async () => {
  const response = await server.fetch(API_ROUTES.rooms, { method: 'POST' })

  expect(response.status).toBe(201)

  return createRoomResponseSchema.parse(await response.json())
}

/** A socket on the room that said hello, and the frames it hears, in order. */
const joinRoom = async (code: string, credentials: Credentials) => {
  const upgraded = await server.fetch(fillRoute(ROOM_SOCKET_ROUTE, { code }), {
    headers: { Upgrade: 'websocket' }
  })
  const socket = upgraded.webSocket

  if (upgraded.status !== 101 || socket === null) {
    throw new Error('The upgrade carried no socket')
  }

  socket.accept()
  const heard: unknown[] = []
  const waiters: (() => void)[] = []

  socket.addEventListener('message', (message) => {
    heard.push(JSON.parse(String(message.data)))
    for (const wake of waiters.splice(0)) {
      wake()
    }
  })

  /** The first frame heard from now on that matches, waiting for it if needed. */
  const nextMatching = (isWanted: (frame: unknown) => boolean) => {
    const from = heard.length

    return new Promise<unknown>((resolveFrame, reject) => {
      const timer = setTimeout(
        () => reject(new Error('No matching frame arrived')),
        FRAME_TIMEOUT_MS
      )
      const look = () => {
        const found = heard.slice(from).find(isWanted)

        if (found === undefined) {
          waiters.push(look)

          return
        }

        clearTimeout(timer)
        resolveFrame(found)
      }

      look()
    })
  }

  const send = (frame: unknown) => socket.send(JSON.stringify(frame))
  const welcomed = nextMatching(() => true)

  send({ credentials, protocolVersion: PROTOCOL_VERSION, type: 'hello' })

  return {
    close: () => socket.close(),
    nextMatching,
    send,
    welcome: await welcomed
  }
}

const ofType = (type: string) => (frame: unknown) =>
  typeof frame === 'object' &&
  frame !== null &&
  'type' in frame &&
  frame.type === type

describe('worker API', () => {
  beforeAll(() => server.listen(), WORKERD_START_TIMEOUT_MS)
  afterAll(() => server.close(), WORKERD_START_TIMEOUT_MS)

  it('answers its health', async () => {
    const response = await server.fetch(API_ROUTES.health)

    expect(healthResponseSchema.parse(await response.json())).toEqual({
      protocolVersion: PROTOCOL_VERSION,
      status: 'ok'
    })
  })

  it('answers 404 with a code on an unknown API path', async () => {
    const response = await server.fetch('/api/nothing-here')

    expect(response.status).toBe(404)
    expect(apiErrorResponseSchema.parse(await response.json()).code).toBe(
      'not_found'
    )
  })

  it('seats a phone and passes its stick to the screen', async () => {
    const { code, screenToken } = await openRoom()
    const screen = await joinRoom(code, { role: 'screen', screenToken })

    expect(screen.welcome).toEqual({ code, seats: [], type: 'room.updated' })

    const seated = screen.nextMatching(ofType('room.updated'))
    const phone = await joinRoom(code, {
      role: 'player',
      sessionId: 'session-of-the-api-test'
    })

    expect(phone.welcome).toMatchObject({ code, type: 'room.updated' })
    expect(await seated).toMatchObject({
      seats: [{ isConnected: true, slot: 0 }]
    })

    const stick = screen.nextMatching(ofType('sumo.stick'))
    phone.send({ type: 'sumo.stick', x: 1, y: 0 })

    expect(await stick).toMatchObject({ type: 'sumo.stick', x: 1, y: 0 })

    phone.close()
    screen.close()
  })

  it('refuses a phone in a room nobody opened', async () => {
    const phone = await joinRoom('WXY9', {
      role: 'player',
      sessionId: 'session-of-the-api-test'
    })

    expect(phone.welcome).toEqual({
      code: 'room_not_found',
      isFatal: true,
      type: 'error'
    })
  })
})
