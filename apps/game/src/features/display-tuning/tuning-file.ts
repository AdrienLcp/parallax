import type { LocalMoment } from '@/infrastructure/dates'

import type { DisplayTuning } from './display-tuning'

/** Which build of the app a tuning was made on. */
export type AppBuild = {
  /** The commit the build was made from, or `null` when the build did not know it. */
  readonly commit: string | null
  readonly version: string
}

const twoDigits = (value: number) => String(value).padStart(2, '0')

/** `parallax-tune-<YYYY-MM-DD-HHmm>.json`, in the display's local time. */
export const tuningFileNameOf = ({
  day,
  hour,
  minute,
  month,
  year
}: LocalMoment): string =>
  `parallax-tune-${year}-${twoDigits(month)}-${twoDigits(day)}-${twoDigits(hour)}${twoDigits(minute)}.json`

/** What a downloaded tuning holds: every value, the backdrop as a colour too, and the build it was tuned on. */
export type TuningFile = {
  readonly app: 'parallax'
  /** The backdrop as `#rrggbb`, whether it came from a preset or the picker. */
  readonly backdropHex: string
  readonly build: AppBuild
  readonly savedAt: string
  readonly tuning: DisplayTuning
}

export const tuningFileOf = ({
  backdropHex,
  build,
  savedAt,
  tuning
}: {
  backdropHex: string
  build: AppBuild
  savedAt: LocalMoment
  tuning: DisplayTuning
}): TuningFile => ({
  app: 'parallax',
  backdropHex,
  build,
  savedAt: savedAt.iso,
  tuning
})
