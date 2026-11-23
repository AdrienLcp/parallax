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
