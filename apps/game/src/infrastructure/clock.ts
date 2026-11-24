import { type LocalMoment, localMomentOf } from './dates'

/** Now, as the display's local clock reads it. */
export const currentMoment = (): LocalMoment => localMomentOf(new Date())
