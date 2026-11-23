/**
 * Every live client sends a frame at least every 5 s, a ping when it has
 * nothing else to say. A tab closed without a close frame just goes quiet:
 * past this long, its socket counts as gone. Two missed pings and some latency.
 */
export const SOCKET_SILENCE_LIMIT_MS = 12_000

export const isSilent = ({
  lastFrameAtMs,
  nowMs
}: {
  lastFrameAtMs: number
  nowMs: number
}): boolean => nowMs - lastFrameAtMs > SOCKET_SILENCE_LIMIT_MS
