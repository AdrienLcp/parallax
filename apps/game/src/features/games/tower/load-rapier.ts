import type { Rapier } from './tower-physics'

let loading: Promise<Rapier> | null = null

/** Rapier, its WebAssembly initialised once for the whole page; loaded only when a tower is shown. */
export const loadRapier = (): Promise<Rapier> => {
  // Its WebAssembly is a file of its own, compiled while it streams in: the
  // page never stalls on it, as it did with the compat build's inlined copy.
  loading ??= import('@dimforge/rapier3d')
  return loading
}
