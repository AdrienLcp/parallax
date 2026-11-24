/** An sRGB colour, each channel from 0 to 1. */
export type SrgbColor = {
  readonly blue: number
  readonly green: number
  readonly red: number
}

/**
 * Resolves any CSS colour the page knows, tokens and `color-mix` included,
 * to sRGB, through a hidden probe under `host` and a one-pixel canvas.
 */
export const resolveCssColor = (
  cssColor: string,
  host: HTMLElement = document.body
): SrgbColor => {
  const probe = document.createElement('span')
  probe.hidden = true
  probe.style.color = cssColor
  host.append(probe)
  const resolved = getComputedStyle(probe).color
  probe.remove()
  const pixel = document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true })
  if (pixel === null) return { blue: 0, green: 0, red: 0 }
  pixel.fillStyle = resolved
  pixel.fillRect(0, 0, 1, 1)
  const [red = 0, green = 0, blue = 0] = pixel.getImageData(0, 0, 1, 1).data
  return { blue: blue / 255, green: green / 255, red: red / 255 }
}
