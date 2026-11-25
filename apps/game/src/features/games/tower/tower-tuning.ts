/** Seated players a tower game needs, and the most it takes. */
export const TOWER_PLAYERS = { fewest: 2, most: 6 } as const

/** The physics steps at this fixed rate whatever the display's refresh. */
export const TOWER_STEP_SECONDS = 1 / 120

/** A frame longer than this (a tab come back to the front) is not caught up. */
export const LONGEST_FRAME_SECONDS = 0.25

/** How often the screen tells the phones the game's state, at most. */
export const TOWER_STATE_REPORT_SECONDS = 0.2

export const TOWER_TUNING = {
  /** How fast a full stick moves the floating block, in alcove units a second. */
  aimSpeed: 0.42,
  /** The bob of a floating block, up and down around its hover height. */
  bob: 0.006,
  /** The chart reads the tower as a child's height: one alcove unit is 1.60 m. */
  cmPerUnit: 160,
  /** Seconds the result stays on the display before the room goes back to its lobby. */
  decidedPauseSeconds: 5,
  /** Gravity in alcove units a second squared: softer than a real one, so a fall reads from across the room. */
  gravity: 6,
  /** How far above the tower's top a floating block hangs. */
  hoverGap: 0.08,
  /** The longest a dropped block may take to come to rest before the game reads the tower anyway. */
  longestSettleSeconds: 4,
  /** How long a race lasts. */
  raceSeconds: 75,
  /** How long every block must stay still before the tower counts as settled. */
  restSeconds: 0.35,
  /** Below this speed, in alcove units a second, a block counts as still. */
  restSpeed: 0.02,
  /** A block's size unit in the shared tower; a race narrows it to fit its columns. */
  sharedUnit: 0.105,
  /** A player who leaves their block floating this long has it dropped where it hovers. */
  turnSeconds: 20
} as const
