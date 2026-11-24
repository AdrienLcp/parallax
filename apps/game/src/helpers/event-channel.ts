export type EventListener<TEvent> = (event: TEvent) => void

/** What a listener holds: it hears every event published after it subscribed. */
export type EventSubscription<TEvent> = {
  /** Answers the function that stops listening. */
  subscribe: (listener: EventListener<TEvent>) => () => void
}

/** A one-way stream: its owner publishes, every subscribed listener hears each event. */
export type EventChannel<TEvent> = EventSubscription<TEvent> & {
  publish: (event: TEvent) => void
}

export const createEventChannel = <TEvent>(): EventChannel<TEvent> => {
  const listeners = new Set<EventListener<TEvent>>()

  return {
    publish: (event) => {
      for (const listener of listeners) {
        listener(event)
      }
    },
    subscribe: (listener) => {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    }
  }
}

/**
 * A channel whose listener first hears the last event published before it
 * subscribed: for a state sent whole and only on change, which a listener
 * mounted late would otherwise wait for until the next change.
 */
export const createReplayingEventChannel = <TEvent>(): EventChannel<TEvent> => {
  const channel = createEventChannel<TEvent>()
  let latest: { event: TEvent } | null = null

  return {
    publish: (event) => {
      latest = { event }
      channel.publish(event)
    },
    subscribe: (listener) => {
      if (latest !== null) {
        listener(latest.event)
      }

      return channel.subscribe(listener)
    }
  }
}
