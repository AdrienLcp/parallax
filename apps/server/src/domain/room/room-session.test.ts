import { describe, expect, it } from 'vitest'

import { ROOM_SEAT_LIMIT } from '@parallax/protocol/room'
import { PROTOCOL_VERSION } from '@parallax/protocol/version'

import { ROOM_OBJECT_MIGRATIONS } from '@/infrastructure/durable-objects/room-object-schema'
import { migrateSchema } from '@/infrastructure/durable-objects/schema-migrations'
import { openNodeSqlDatabase } from '@/infrastructure/durable-objects/testing/node-sql-database'

import type { Admission } from './admission'
import type { OpenedRoom } from './room'
import { openRoom } from './room-service'
import { handleFrame } from './room-session'
import { createRoomStore, type RoomStore } from './room-store'
import { SEAT_RELEASE_AFTER_MS } from './seat-release'

const ROOM: OpenedRoom = {
  code: 'ABCD',
  game: 'sumo',
  screenToken: 'screen-token-of-the-test-room'
}

const createStore = (): RoomStore => {
  const database = openNodeSqlDatabase()
  migrateSchema(database, ROOM_OBJECT_MIGRATIONS)

  return createRoomStore(database)
}

const openedStore = (): RoomStore => {
  const store = createStore()
  openRoom(store, ROOM)

  return store
}

const seatIdsInOrder = () => {
  let minted = 0

  return () => {
    minted += 1

    return `seat-${minted}`
  }
}

const sessionOf = (index: number) => `session-of-phone-${index}`

const helloFrame = (credentials: Record<string, string>) =>
  JSON.stringify({
    credentials,
    protocolVersion: PROTOCOL_VERSION,
    type: 'hello'
  })

const sendFrame = ({
  admission = null,
  frame,
  mintSeatId = seatIdsInOrder(),
  nowMs = 0,
  store
}: {
  admission?: Admission | null
  frame: string
  mintSeatId?: () => string
  nowMs?: number
  store: RoomStore
}) => handleFrame({ admission, mintSeatId, nowMs, raw: frame, store })

const fillRoom = (store: RoomStore, mintSeatId: () => string) => {
  for (let phone = 1; phone <= ROOM_SEAT_LIMIT; phone += 1) {
    sendFrame({
      frame: helloFrame({ role: 'player', sessionId: sessionOf(phone) }),
      mintSeatId,
      store
    })
  }
}

const LEFT_AT_MS = 1_000
const RELEASED_AT_MS = LEFT_AT_MS + SEAT_RELEASE_AFTER_MS

const PLAYER: Admission = { role: 'player', seatId: 'seat-1' }
const SCREEN: Admission = { role: 'screen' }

describe('handleFrame', () => {
  it('seats a new phone in the first free slot', () => {
    const store = openedStore()

    const outcome = sendFrame({
      frame: helloFrame({ role: 'player', sessionId: sessionOf(1) }),
      store
    })

    expect(outcome).toEqual({
      admission: PLAYER,
      event: { kind: 'admitted' },
      reply: null,
      shouldClose: false
    })
    expect(store.readSeats()).toEqual([
      {
        absentSinceMs: null,
        isReady: false,
        name: null,
        seatId: 'seat-1',
        sessionId: sessionOf(1),
        slot: 0
      }
    ])
  })

  it('gives a returning phone its seat back', () => {
    const store = openedStore()
    const mintSeatId = seatIdsInOrder()
    const hello = helloFrame({ role: 'player', sessionId: sessionOf(1) })

    sendFrame({ frame: hello, mintSeatId, store })
    const again = sendFrame({ frame: hello, mintSeatId, store })

    expect(again.admission).toEqual(PLAYER)
    expect(store.readSeats()).toHaveLength(1)
  })

  it('refuses a phone once every seat is taken, and closes it', () => {
    const store = openedStore()
    const mintSeatId = seatIdsInOrder()

    fillRoom(store, mintSeatId)

    const outcome = sendFrame({
      frame: helloFrame({
        role: 'player',
        sessionId: sessionOf(ROOM_SEAT_LIMIT + 1)
      }),
      mintSeatId,
      store
    })

    expect(outcome.reply).toEqual({
      code: 'room_full',
      isFatal: true,
      type: 'error'
    })
    expect(outcome.shouldClose).toBe(true)
  })

  it('keeps an absent seat for its phone until the release delay is over', () => {
    const store = openedStore()
    const mintSeatId = seatIdsInOrder()
    fillRoom(store, mintSeatId)
    store.recordAbsences([{ absentSinceMs: LEFT_AT_MS, seatId: 'seat-3' }])

    const outcome = sendFrame({
      frame: helloFrame({ role: 'player', sessionId: sessionOf(7) }),
      mintSeatId,
      nowMs: RELEASED_AT_MS - 1,
      store
    })

    expect(outcome.reply).toEqual({
      code: 'room_full',
      isFatal: true,
      type: 'error'
    })
  })

  it('gives a newcomer the slot of the seat released first', () => {
    const store = openedStore()
    const mintSeatId = seatIdsInOrder()
    fillRoom(store, mintSeatId)
    store.recordAbsences([
      { absentSinceMs: LEFT_AT_MS + 10, seatId: 'seat-2' },
      { absentSinceMs: LEFT_AT_MS, seatId: 'seat-5' }
    ])

    const outcome = sendFrame({
      frame: helloFrame({ role: 'player', sessionId: sessionOf(7) }),
      mintSeatId,
      nowMs: RELEASED_AT_MS + 10,
      store
    })

    expect(outcome.admission).toEqual({ role: 'player', seatId: 'seat-7' })
    expect(store.readSeats().at(4)).toEqual({
      absentSinceMs: null,
      isReady: false,
      name: null,
      seatId: 'seat-7',
      sessionId: sessionOf(7),
      slot: 4
    })
    expect(store.readSeats()).toHaveLength(ROOM_SEAT_LIMIT)
  })

  it('gives a newcomer an empty slot before a released one', () => {
    const store = openedStore()
    const mintSeatId = seatIdsInOrder()
    sendFrame({
      frame: helloFrame({ role: 'player', sessionId: sessionOf(1) }),
      mintSeatId,
      store
    })
    store.recordAbsences([{ absentSinceMs: LEFT_AT_MS, seatId: 'seat-1' }])

    sendFrame({
      frame: helloFrame({ role: 'player', sessionId: sessionOf(2) }),
      mintSeatId,
      nowMs: RELEASED_AT_MS,
      store
    })

    expect(store.readSeats().map(({ seatId, slot }) => [seatId, slot])).toEqual(
      [
        ['seat-1', 0],
        ['seat-2', 1]
      ]
    )
  })

  it('gives a released seat back to its phone while nobody took the slot', () => {
    const store = openedStore()
    const mintSeatId = seatIdsInOrder()
    const hello = helloFrame({ role: 'player', sessionId: sessionOf(1) })
    sendFrame({ frame: hello, mintSeatId, store })
    store.recordAbsences([{ absentSinceMs: LEFT_AT_MS, seatId: 'seat-1' }])

    const back = sendFrame({
      frame: hello,
      mintSeatId,
      nowMs: RELEASED_AT_MS * 10,
      store
    })

    expect(back.admission).toEqual(PLAYER)
  })

  it('admits the screen only with the token the room was opened with', () => {
    const store = openedStore()

    const admitted = sendFrame({
      frame: helloFrame({ role: 'screen', screenToken: ROOM.screenToken }),
      store
    })
    const refused = sendFrame({
      frame: helloFrame({
        role: 'screen',
        screenToken: 'somebody-elses-guess-at-it'
      }),
      store
    })

    expect(admitted.admission).toEqual(SCREEN)
    expect(refused.reply?.type === 'error' && refused.reply.code).toBe(
      'screen_token_invalid'
    )
  })

  it('refuses a room nobody opened', () => {
    const outcome = sendFrame({
      frame: helloFrame({ role: 'player', sessionId: sessionOf(1) }),
      store: createStore()
    })

    expect(outcome.reply?.type === 'error' && outcome.reply.code).toBe(
      'room_not_found'
    )
    expect(outcome.shouldClose).toBe(true)
  })

  it('refuses a stale protocol version', () => {
    const outcome = sendFrame({
      frame: JSON.stringify({
        credentials: { role: 'player', sessionId: sessionOf(1) },
        protocolVersion: PROTOCOL_VERSION + 1,
        type: 'hello'
      }),
      store: openedStore()
    })

    expect(outcome.reply?.type === 'error' && outcome.reply.code).toBe(
      'protocol_version_mismatch'
    )
  })

  it('answers a ping before hello, and closes on any other frame', () => {
    const store = openedStore()

    const ping = sendFrame({ frame: '{"type":"ping"}', store })
    const stick = sendFrame({
      frame: '{"type":"sumo.stick","x":0,"y":1}',
      store
    })

    expect(ping.reply).toEqual({ type: 'pong' })
    expect(ping.event).toEqual({ kind: 'pinged' })
    expect(stick.reply?.type === 'error' && stick.reply.code).toBe(
      'hello_required'
    )
    expect(stick.shouldClose).toBe(true)
  })

  it('passes a stick to the screen stamped with the seat that sent it', () => {
    const outcome = sendFrame({
      admission: PLAYER,
      frame: '{"type":"sumo.stick","x":0.5,"y":-1}',
      store: openedStore()
    })

    expect(outcome.event).toEqual({
      kind: 'to_screen',
      message: { seatId: 'seat-1', type: 'sumo.stick', x: 0.5, y: -1 }
    })
  })

  it('passes a jump to the screen stamped with the seat that sent it', () => {
    const outcome = sendFrame({
      admission: PLAYER,
      frame: '{"type":"sumo.jump"}',
      store: openedStore()
    })

    expect(outcome.event).toEqual({
      kind: 'to_screen',
      message: { seatId: 'seat-1', type: 'sumo.jump' }
    })
  })

  it('passes the screen state to the phones', () => {
    const state = { phase: 'fighting', tops: [], type: 'sumo.state' }

    const outcome = sendFrame({
      admission: SCREEN,
      frame: JSON.stringify(state),
      store: openedStore()
    })

    expect(outcome.event).toEqual({ kind: 'to_players', message: state })
  })

  it.each([
    [
      '{"type":"tower.aim","x":-0.25,"z":1}',
      { type: 'tower.aim', x: -0.25, z: 1 }
    ],
    ['{"type":"tower.drop"}', { type: 'tower.drop' }],
    ['{"type":"tower.pick","choice":1}', { choice: 1, type: 'tower.pick' }],
    ['{"rate":-0.5,"type":"tower.spin"}', { rate: -0.5, type: 'tower.spin' }],
    [
      '{"rule":"race","type":"tower.rule"}',
      { rule: 'race', type: 'tower.rule' }
    ]
  ])(
    'passes the tower frame %s to the screen stamped with its seat',
    (frame, message) => {
      const outcome = sendFrame({
        admission: PLAYER,
        frame,
        store: openedStore()
      })

      expect(outcome.event).toEqual({
        kind: 'to_screen',
        message: { ...message, seatId: 'seat-1' }
      })
    }
  )

  it('passes the tower state to the phones, and only from the screen', () => {
    const state = {
      phase: 'aiming',
      rule: 'shared',
      seats: [
        {
          heightCm: 42,
          offer: { blocks: ['arch', 'plank'], choice: 0 },
          score: 2,
          seatId: 'seat-1',
          secondsLeft: 12,
          won: false
        }
      ],
      turnSeatId: 'seat-1',
      turns: { of: 6, played: 2 },
      type: 'tower.state'
    }
    const frame = JSON.stringify(state)

    const fromScreen = sendFrame({
      admission: SCREEN,
      frame,
      store: openedStore()
    })
    const fromPhone = sendFrame({
      admission: PLAYER,
      frame,
      store: openedStore()
    })

    expect(fromScreen.event).toEqual({ kind: 'to_players', message: state })
    expect(fromPhone.reply?.type === 'error' && fromPhone.reply.code).toBe(
      'wrong_role'
    )
  })

  it('refuses a tower rule it does not know', () => {
    const outcome = sendFrame({
      admission: PLAYER,
      frame: '{"rule":"solo","type":"tower.rule"}',
      store: openedStore()
    })

    expect(outcome.reply?.type === 'error' && outcome.reply.code).toBe(
      'invalid_message'
    )
  })

  it.each([
    [
      '{"type":"claw.stick","x":0.5,"z":-1}',
      { type: 'claw.stick', x: 0.5, z: -1 }
    ],
    ['{"type":"claw.drop"}', { type: 'claw.drop' }]
  ])(
    'passes the claw frame %s to the screen stamped with its seat',
    (frame, message) => {
      const outcome = sendFrame({
        admission: PLAYER,
        frame,
        store: openedStore()
      })

      expect(outcome.event).toEqual({
        kind: 'to_screen',
        message: { ...message, seatId: 'seat-1' }
      })
    }
  )

  it('passes the claw state to the phones, and only from the screen', () => {
    const state = {
      phase: 'playing',
      seats: [
        { activity: 'aiming', score: 3, seatId: 'seat-1', x: 0.2, z: -0.4 }
      ],
      secondsLeft: 41,
      type: 'claw.state',
      winners: []
    }
    const frame = JSON.stringify(state)

    const fromScreen = sendFrame({
      admission: SCREEN,
      frame,
      store: openedStore()
    })
    const fromPhone = sendFrame({
      admission: PLAYER,
      frame,
      store: openedStore()
    })

    expect(fromScreen.event).toEqual({ kind: 'to_players', message: state })
    expect(fromPhone.reply?.type === 'error' && fromPhone.reply.code).toBe(
      'wrong_role'
    )
  })

  it.each([
    [
      '{"type":"globe.stick","x":-0.25,"y":1}',
      { type: 'globe.stick', x: -0.25, y: 1 }
    ],
    ['{"type":"globe.zoom","rate":0.5}', { rate: 0.5, type: 'globe.zoom' }],
    ['{"type":"globe.plant"}', { type: 'globe.plant' }]
  ])(
    'passes the globe frame %s to the screen stamped with its seat',
    (frame, message) => {
      const outcome = sendFrame({
        admission: PLAYER,
        frame,
        store: openedStore()
      })

      expect(outcome.event).toEqual({
        kind: 'to_screen',
        message: { ...message, seatId: 'seat-1' }
      })
    }
  )

  it('passes the globe state to the phones, and only from the screen', () => {
    const state = {
      phase: 'reveal',
      place: { id: 'country:PE', kind: 'country' },
      result: { km: 212, points: 640, seatId: 'seat-1' },
      seats: [{ score: 640, seatId: 'seat-1', won: false }],
      secondsLeft: null,
      turnSeatId: 'seat-1',
      turns: { of: 6, played: 1 },
      type: 'globe.state'
    }
    const frame = JSON.stringify(state)

    const fromScreen = sendFrame({
      admission: SCREEN,
      frame,
      store: openedStore()
    })
    const fromPhone = sendFrame({
      admission: PLAYER,
      frame,
      store: openedStore()
    })

    expect(fromScreen.event).toEqual({ kind: 'to_players', message: state })
    expect(fromPhone.reply?.type === 'error' && fromPhone.reply.code).toBe(
      'wrong_role'
    )
  })

  it('refuses a frame from the wrong role without closing', () => {
    const outcome = sendFrame({
      admission: SCREEN,
      frame: '{"type":"sumo.dash"}',
      store: openedStore()
    })

    expect(outcome.reply).toEqual({
      code: 'wrong_role',
      isFatal: false,
      type: 'error'
    })
    expect(outcome.shouldClose).toBe(false)
  })

  it('marks a phone ready under its picked name, then takes the mark back and keeps the name', () => {
    const store = openedStore()
    sendFrame({
      frame: helloFrame({ role: 'player', sessionId: sessionOf(1) }),
      store
    })

    const ready = sendFrame({
      admission: PLAYER,
      frame: '{"type":"seat.ready","name":"Ada"}',
      store
    })

    expect(ready.event).toEqual({ kind: 'room_changed' })
    expect(store.readSeats().at(0)).toMatchObject({
      isReady: true,
      name: 'Ada'
    })

    sendFrame({ admission: PLAYER, frame: '{"type":"seat.unready"}', store })

    expect(store.readSeats().at(0)).toMatchObject({
      isReady: false,
      name: 'Ada'
    })
  })

  it('refuses a name the phone did not clean', () => {
    const store = openedStore()
    sendFrame({
      frame: helloFrame({ role: 'player', sessionId: sessionOf(1) }),
      store
    })

    const outcome = sendFrame({
      admission: PLAYER,
      frame: JSON.stringify({ name: ' Ada‮ ', type: 'seat.ready' }),
      store
    })

    expect(outcome.reply?.type === 'error' && outcome.reply.code).toBe(
      'invalid_message'
    )
    expect(store.readSeats().at(0)).toMatchObject({
      isReady: false,
      name: null
    })
  })

  it('spends every ready mark once the screen starts a game', () => {
    const store = openedStore()
    const mintSeatId = seatIdsInOrder()
    for (const phone of [1, 2]) {
      const { admission } = sendFrame({
        frame: helloFrame({ role: 'player', sessionId: sessionOf(phone) }),
        mintSeatId,
        store
      })
      sendFrame({
        admission,
        frame: '{"type":"seat.ready","name":null}',
        store
      })
    }

    const started = sendFrame({
      admission: SCREEN,
      frame: '{"type":"game.started"}',
      store
    })

    expect(started.event).toEqual({ kind: 'room_changed' })
    expect(store.readSeats().map((seat) => seat.isReady)).toEqual([
      false,
      false
    ])
  })

  it('lets only phones ready up and only the screen start a game', () => {
    const store = openedStore()

    for (const [admission, frame] of [
      [SCREEN, '{"type":"seat.ready","name":null}'],
      [SCREEN, '{"type":"seat.unready"}'],
      [PLAYER, '{"type":"game.started"}']
    ] as const) {
      const outcome = sendFrame({ admission, frame, store })
      expect(outcome.reply?.type === 'error' && outcome.reply.code).toBe(
        'wrong_role'
      )
    }
  })

  it('starts a game in the playing phase and brings the room back to its lobby when it ends', () => {
    const store = openedStore()

    sendFrame({ admission: SCREEN, frame: '{"type":"game.started"}', store })
    expect(store.readRoom()?.phase).toBe('playing')

    const ended = sendFrame({
      admission: SCREEN,
      frame: '{"type":"game.ended"}',
      store
    })

    expect(ended.event).toEqual({ kind: 'room_changed' })
    expect(store.readRoom()?.phase).toBe('lobby')
  })

  it('lets a phone or the screen change the game in the lobby, spending every ready mark', () => {
    const store = openedStore()
    const { admission } = sendFrame({
      frame: helloFrame({ role: 'player', sessionId: sessionOf(1) }),
      store
    })
    sendFrame({ admission, frame: '{"type":"seat.ready","name":null}', store })

    for (const by of [admission, SCREEN]) {
      const changed = sendFrame({
        admission: by,
        frame: '{"type":"room.game","game":"sumo"}',
        store
      })
      expect(changed.event).toEqual({ kind: 'room_changed' })
    }

    expect(store.readRoom()?.game).toBe('sumo')
    expect(store.readSeats().at(0)?.isReady).toBe(false)
  })

  it('refuses a game change while a game runs, without closing', () => {
    const store = openedStore()
    sendFrame({ admission: SCREEN, frame: '{"type":"game.started"}', store })

    const outcome = sendFrame({
      admission: PLAYER,
      frame: '{"type":"room.game","game":"sumo"}',
      store
    })

    expect(outcome.reply).toEqual({
      code: 'wrong_phase',
      isFatal: false,
      type: 'error'
    })
    expect(outcome.shouldClose).toBe(false)
  })

  it('refuses a game the app does not host', () => {
    const outcome = sendFrame({
      admission: SCREEN,
      frame: '{"type":"room.game","game":"chess"}',
      store: openedStore()
    })

    expect(outcome.reply?.type === 'error' && outcome.reply.code).toBe(
      'invalid_message'
    )
  })

  it('lets the screen remove a seat, which a returning phone does not get back', () => {
    const store = openedStore()
    const mintSeatId = seatIdsInOrder()
    const hello = helloFrame({ role: 'player', sessionId: sessionOf(1) })
    sendFrame({ frame: hello, mintSeatId, store })

    const kicked = sendFrame({
      admission: SCREEN,
      frame: '{"type":"seat.kick","seatId":"seat-1"}',
      store
    })

    expect(kicked.event).toEqual({ kind: 'seat_removed', seatId: 'seat-1' })
    expect(store.readSeats()).toEqual([])
    expect(sendFrame({ frame: hello, mintSeatId, store }).admission).toEqual({
      role: 'player',
      seatId: 'seat-2'
    })
  })

  it('lets a phone give its seat back, and closes it', () => {
    const store = openedStore()
    const { admission } = sendFrame({
      frame: helloFrame({ role: 'player', sessionId: sessionOf(1) }),
      store
    })

    const left = sendFrame({ admission, frame: '{"type":"seat.leave"}', store })

    expect(left).toMatchObject({
      event: { kind: 'room_changed' },
      reply: { code: 'seat_left', isFatal: true, type: 'error' },
      shouldClose: true
    })
    expect(store.readSeats()).toEqual([])
  })

  it('lets only the screen end a game or remove a seat, and only a phone leave', () => {
    const store = openedStore()

    for (const [admission, frame] of [
      [PLAYER, '{"type":"game.ended"}'],
      [PLAYER, '{"type":"seat.kick","seatId":"seat-1"}'],
      [SCREEN, '{"type":"seat.leave"}']
    ] as const) {
      const outcome = sendFrame({ admission, frame, store })
      expect(outcome.reply?.type === 'error' && outcome.reply.code).toBe(
        'wrong_role'
      )
    }
  })

  it('refuses a stick off its range', () => {
    const outcome = sendFrame({
      admission: PLAYER,
      frame: '{"type":"sumo.stick","x":3,"y":0}',
      store: openedStore()
    })

    expect(outcome.reply?.type === 'error' && outcome.reply.code).toBe(
      'invalid_message'
    )
  })
})

describe('openRoom', () => {
  it('opens a room once', () => {
    const store = createStore()

    expect(openRoom(store, ROOM).status).toBe('success')
    expect(openRoom(store, ROOM)).toEqual({
      error: 'already_open',
      status: 'failure'
    })
  })
})
