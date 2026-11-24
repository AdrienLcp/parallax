/** A moment as the display's local clock reads it, with its ISO form. */
export type LocalMoment = {
  readonly day: number
  readonly hour: number
  /** The moment in UTC, as `toISOString` writes it. */
  readonly iso: string
  readonly minute: number
  /** 1 for January. */
  readonly month: number
  readonly year: number
}

export const localMomentOf = (date: Date): LocalMoment => ({
  day: date.getDate(),
  hour: date.getHours(),
  iso: date.toISOString(),
  minute: date.getMinutes(),
  month: date.getMonth() + 1,
  year: date.getFullYear()
})

/** The local moment at a wall-clock day and minute. */
export const localMomentAt = ({
  day,
  hour,
  minute,
  month,
  year
}: Omit<LocalMoment, 'iso'>): LocalMoment =>
  localMomentOf(new Date(year, month - 1, day, hour, minute))
