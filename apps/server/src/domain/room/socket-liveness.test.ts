import { describe, expect, it } from 'vitest'

import { isSilent, SOCKET_SILENCE_LIMIT_MS } from './socket-liveness'

describe('isSilent', () => {
  it('keeps a socket that spoke within the limit', () => {
    expect(
      isSilent({ lastFrameAtMs: 1000, nowMs: 1000 + SOCKET_SILENCE_LIMIT_MS })
    ).toBe(false)
  })

  it('lets go of a socket quiet for longer than the limit', () => {
    expect(
      isSilent({
        lastFrameAtMs: 1000,
        nowMs: 1001 + SOCKET_SILENCE_LIMIT_MS
      })
    ).toBe(true)
  })
})
