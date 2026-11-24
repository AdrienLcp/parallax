import { z } from 'zod'

import type { ArenaLens } from '@/features/games/sumo/arena-camera'
import { ORBIT_MODES } from '@/features/games/sumo/arena-orbit'
import type { ArenaShape } from '@/features/games/sumo/arena-shape'
import {
  type ArenaLighting,
  type ArenaTuning,
  SHIPPED_ARENA_TUNING
} from '@/features/games/sumo/arena-tuning'
import type { SrgbColor } from '@/infrastructure/css-color'

/** The backdrops offered at a click, darkest first. */
export const BACKDROP_PRESETS = [
  'lacquer-ink',
  'slate',
  'felt',
  'grey',
  'ivory',
  'white'
] as const

export type BackdropPreset = (typeof BACKDROP_PRESETS)[number]

/** A preset, or a colour picked freely, as `#rrggbb`. */
export type Backdrop = BackdropPreset | `#${string}`

const PRESET_COLORS: Record<BackdropPreset, string> = {
  felt: 'var(--felt)',
  grey: 'oklch(62% 0 0)',
  ivory: 'var(--ivory)',
  'lacquer-ink': 'var(--lacquer-ink)',
  slate: 'var(--slate)',
  white: 'oklch(100% 0 0)'
}

const HEX_COLOR = /^#[\da-f]{6}$/i

const isHexColor = (value: string): value is `#${string}` =>
  HEX_COLOR.test(value)

const presetNamed = (value: string): BackdropPreset | undefined =>
  BACKDROP_PRESETS.find((preset) => preset === value)

/** The backdrop a preset's name or a `#rrggbb` colour stands for, or `null` for anything else. */
export const backdropFrom = (value: string): Backdrop | null =>
  presetNamed(value) ??
  (isHexColor(value) ? `#${value.slice(1).toLowerCase()}` : null)

/** The preset a backdrop is, or `null` for a colour picked freely. */
export const presetOf = (backdrop: Backdrop): BackdropPreset | null =>
  presetNamed(backdrop) ?? null

/** The CSS colour a backdrop paints. */
export const backdropColorOf = (backdrop: Backdrop): string => {
  const preset = presetNamed(backdrop)
  return preset === undefined ? backdrop : PRESET_COLORS[preset]
}

/** How the display's own lettering sits on the backdrop. */
export type HudTuning = {
  /** Scales the header and the roster; the arena takes the room they leave. */
  readonly scale: number
  readonly showHeader: boolean
  readonly showQr: boolean
  readonly showRoster: boolean
}

/** Everything tuned on the display by eye: its backdrop, the arena, and the lettering around it. */
export type DisplayTuning = {
  readonly arena: ArenaTuning
  readonly backdrop: Backdrop
  readonly hud: HudTuning
}

export const SHIPPED_TUNING: DisplayTuning = {
  arena: SHIPPED_ARENA_TUNING,
  backdrop: 'lacquer-ink',
  hud: { scale: 1, showHeader: true, showQr: true, showRoster: true }
}

/** The span a setting may take, and the step a slider moves it by. */
export type NumberRange = {
  readonly highest: number
  readonly lowest: number
  readonly step: number
}

type NumericKeys<Group> = {
  [Key in keyof Group]: Group[Key] extends number ? Key : never
}[keyof Group]

export const LENS_RANGES: Record<keyof ArenaLens, NumberRange> = {
  fieldOfViewDegrees: { highest: 90, lowest: 10, step: 1 },
  frameFill: { highest: 1, lowest: 0.3, step: 0.01 },
  pitchDegrees: { highest: 75, lowest: 0, step: 1 },
  verticalCentre: { highest: 0.8, lowest: 0.2, step: 0.01 }
}

export const MOTION_RANGES: Record<
  NumericKeys<ArenaTuning['motion']>,
  NumberRange
> = {
  orbitDegreesPerSecond: { highest: 90, lowest: 1, step: 1 },
  swayDegrees: { highest: 45, lowest: 0, step: 1 }
}

export const SHAPE_RANGES: Record<keyof ArenaShape, NumberRange> = {
  drumHeightScale: { highest: 4, lowest: 0.5, step: 0.05 },
  topHeightScale: { highest: 3, lowest: 0.5, step: 0.05 }
}

export const LIGHTING_RANGES: Record<keyof ArenaLighting, NumberRange> = {
  keyLightIntensity: { highest: 8, lowest: 0, step: 0.1 },
  shadowOpacity: { highest: 1, lowest: 0, step: 0.01 }
}

export const HUD_SCALE_RANGE: NumberRange = {
  highest: 1.5,
  lowest: 0.5,
  step: 0.05
}

/** A number kept inside its range, or the shipped value when it is not a number at all. */
const rangedNumber = ({ highest, lowest }: NumberRange, shipped: number) =>
  z
    .number()
    .transform((value) => Math.min(highest, Math.max(lowest, value)))
    .catch(shipped)

const { lens, lighting, motion, shape } = SHIPPED_TUNING.arena
const shippedHud = SHIPPED_TUNING.hud

const tuningSchema = z.object({
  arena: z
    .object({
      lens: z
        .object({
          fieldOfViewDegrees: rangedNumber(
            LENS_RANGES.fieldOfViewDegrees,
            lens.fieldOfViewDegrees
          ),
          frameFill: rangedNumber(LENS_RANGES.frameFill, lens.frameFill),
          pitchDegrees: rangedNumber(
            LENS_RANGES.pitchDegrees,
            lens.pitchDegrees
          ),
          verticalCentre: rangedNumber(
            LENS_RANGES.verticalCentre,
            lens.verticalCentre
          )
        })
        .catch(lens),
      lighting: z
        .object({
          keyLightIntensity: rangedNumber(
            LIGHTING_RANGES.keyLightIntensity,
            lighting.keyLightIntensity
          ),
          shadowOpacity: rangedNumber(
            LIGHTING_RANGES.shadowOpacity,
            lighting.shadowOpacity
          )
        })
        .catch(lighting),
      motion: z
        .object({
          orbit: z.enum(ORBIT_MODES).catch(motion.orbit),
          orbitDegreesPerSecond: rangedNumber(
            MOTION_RANGES.orbitDegreesPerSecond,
            motion.orbitDegreesPerSecond
          ),
          swayDegrees: rangedNumber(
            MOTION_RANGES.swayDegrees,
            motion.swayDegrees
          )
        })
        .catch(motion),
      shape: z
        .object({
          drumHeightScale: rangedNumber(
            SHAPE_RANGES.drumHeightScale,
            shape.drumHeightScale
          ),
          topHeightScale: rangedNumber(
            SHAPE_RANGES.topHeightScale,
            shape.topHeightScale
          )
        })
        .catch(shape)
    })
    .catch(SHIPPED_TUNING.arena),
  backdrop: z
    .string()
    .transform((value, context) => {
      const backdrop = backdropFrom(value)
      if (backdrop === null) {
        context.addIssue({ code: 'custom', message: 'Not a backdrop' })
        return z.NEVER
      }
      return backdrop
    })
    .catch(SHIPPED_TUNING.backdrop),
  hud: z
    .object({
      scale: rangedNumber(HUD_SCALE_RANGE, shippedHud.scale),
      showHeader: z.boolean().catch(shippedHud.showHeader),
      showQr: z.boolean().catch(shippedHud.showQr),
      showRoster: z.boolean().catch(shippedHud.showRoster)
    })
    .catch(shippedHud)
})

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Reads a tuning from anything a storage or a downloaded file may hold: a
 * value out of range is brought inside it, and anything missing or unreadable
 * falls back to its shipped value. A downloaded file is read through its
 * `tuning` field.
 */
export const parseTuning = (value: unknown): DisplayTuning => {
  const tuning = isRecord(value) && 'tuning' in value ? value.tuning : value
  const parsed: DisplayTuning = tuningSchema.parse(
    isRecord(tuning) ? tuning : {}
  )
  return parsed
}

const linear = (channel: number) =>
  channel <= 0.040_45 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4

/** The WCAG relative luminance of a colour, from 0 (black) to 1 (white). */
export const relativeLuminanceOf = ({ blue, green, red }: SrgbColor): number =>
  0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue)

/** Whether the backdrop calls for the display's light lettering (`dark`) or its dark lettering (`light`). */
export type BackdropTone = 'dark' | 'light'

/** The relative luminance of the chalk lettering and of the lacquer-ink lettering that replaces it. */
const CHALK_LUMINANCE = 0.807
const LACQUER_INK_LUMINANCE = 0.009

const contrastBetween = (lighter: number, darker: number) =>
  (lighter + 0.05) / (darker + 0.05)

/** The tone whose lettering stands out more on a backdrop of this relative luminance. */
export const toneOfBackdrop = (luminance: number): BackdropTone =>
  contrastBetween(luminance, LACQUER_INK_LUMINANCE) >
  contrastBetween(CHALK_LUMINANCE, luminance)
    ? 'light'
    : 'dark'

const channelHex = (channel: number) =>
  Math.round(Math.min(1, Math.max(0, channel)) * 255)
    .toString(16)
    .padStart(2, '0')

/** The colour as `#rrggbb`, the way a colour input takes it. */
export const hexOf = ({ blue, green, red }: SrgbColor): `#${string}` =>
  `#${channelHex(red)}${channelHex(green)}${channelHex(blue)}`
