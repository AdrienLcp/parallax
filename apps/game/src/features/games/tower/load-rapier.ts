import type { Rapier } from './tower-physics'

let loading: Promise<Rapier> | null = null

/** Rapier, its WebAssembly initialised once for the whole page; loaded only when a tower is shown. */
export const loadRapier = (): Promise<Rapier> => {
  loading ??= import('@dimforge/rapier3d-compat').then(async (module) => {
    const rapier = module.default
    await rapier.init()
    return rapier
  })
  return loading
}
