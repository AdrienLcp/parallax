/**
 * The feel of the sumo, in arena units (the arena's radius is 1) and seconds.
 * Tuned by playing; every rule reads them from here.
 */
export const SUMO_TUNING = {
  arenaRadius: 1,
  countdownSeconds: 3,
  dashCooldownSeconds: 1.6,
  dashImpulse: 1.1,
  driveAcceleration: 2.4,
  fallSeconds: 0.9,
  friction: 1.6,
  /** How long the match's winner stays on the arena before the room gathers again. */
  matchPauseSeconds: 6,
  maximumDriveSpeed: 0.9,
  restitution: 0.9,
  /** How long a decided round stays on the arena: time to read the last ejection. */
  roundPauseSeconds: 3,
  roundsToWin: 3,
  spawnRadius: 0.55,
  topRadius: 0.085
} as const

/** Connected seats a round needs to start, and the most the arena takes. */
export const SUMO_PLAYERS = { fewest: 2, most: 6 } as const

/** The screen steps the simulation at this fixed rate, whatever its display refresh. */
export const SUMO_STEP_SECONDS = 1 / 60

/** How often, at most, the screen tells the phones the state of the game. */
export const SUMO_STATE_REPORT_SECONDS = 0.2
