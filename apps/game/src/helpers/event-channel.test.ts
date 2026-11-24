import { describe, expect, it } from 'vitest'

import {
  createEventChannel,
  createReplayingEventChannel
} from './event-channel'

describe('createEventChannel', () => {
  it('delivers each event to every listener subscribed at the time', () => {
    const channel = createEventChannel<number>()
    const first: number[] = []
    const second: number[] = []

    channel.subscribe((event) => first.push(event))
    channel.publish(1)
    channel.subscribe((event) => second.push(event))
    channel.publish(2)

    expect(first).toEqual([1, 2])
    expect(second).toEqual([2])
  })

  it('stops delivering once a listener unsubscribes', () => {
    const channel = createEventChannel<number>()
    const heard: number[] = []

    const unsubscribe = channel.subscribe((event) => heard.push(event))
    channel.publish(1)
    unsubscribe()
    channel.publish(2)

    expect(heard).toEqual([1])
  })
})

describe('createReplayingEventChannel', () => {
  it('gives a late listener the last event first, then the next ones', () => {
    const channel = createReplayingEventChannel<number>()
    const heard: number[] = []
    channel.publish(1)
    channel.publish(2)

    channel.subscribe((event) => heard.push(event))
    channel.publish(3)

    expect(heard).toEqual([2, 3])
  })

  it('stops delivering once a listener unsubscribes, too', () => {
    const channel = createReplayingEventChannel<number>()
    const heard: number[] = []
    const stop = channel.subscribe((event) => heard.push(event))

    stop()
    channel.publish(1)

    expect(heard).toEqual([])
  })
})
