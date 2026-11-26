import { Color, SRGBColorSpace } from 'three'

import type { SeatSlot } from '@parallax/protocol/room'

export type SceneColors = {
  dispose: () => void
  /** Any CSS colour the page knows, tokens and `color-mix` included, in sRGB. */
  read: (cssColor: string) => Color
  /** A seat's own custom property (`--seat`, `--seat-cap`…) as its slot sets it. */
  readSeat: (slot: SeatSlot, property?: string) => Color
}

/**
 * Resolves the page's colours for a three scene mounted in `host`. The page
 * resolves to `oklch(…)`, which three cannot parse: a canvas pixel turns it
 * into sRGB.
 */
export const createSceneColors = (host: HTMLElement): SceneColors => {
  const probe = document.createElement('span')
  probe.hidden = true
  host.append(probe)
  const pixel = document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true })
  const read = (cssColor: string): Color => {
    probe.style.color = cssColor
    const resolved = getComputedStyle(probe).color
    if (pixel === null) return new Color(resolved)
    pixel.clearRect(0, 0, 1, 1)
    pixel.fillStyle = resolved
    pixel.fillRect(0, 0, 1, 1)
    const [red = 0, green = 0, blue = 0] = pixel.getImageData(0, 0, 1, 1).data
    return new Color().setRGB(
      red / 255,
      green / 255,
      blue / 255,
      SRGBColorSpace
    )
  }
  const readSeat = (slot: SeatSlot, property = '--seat'): Color => {
    probe.dataset.seatSlot = String(slot)
    const color = read(getComputedStyle(probe).getPropertyValue(property))
    delete probe.dataset.seatSlot
    return color
  }
  return { dispose: () => probe.remove(), read, readSeat }
}
