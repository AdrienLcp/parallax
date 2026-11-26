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
  /** How long a top stays in the air when it jumps: a dash passes under it. */
  jumpAirSeconds: 0.55,
  jumpCooldownSeconds: 1.4,
  /** How high a jumping top rises at the top of its hop. */
  jumpHeight: 0.45,
  /** How long the match's winner stays on the arena before the room gathers again. */
  matchPauseSeconds: 6,
  maximumDriveSpeed: 0.9,
  /** A top that leaves the platform this soon after touching another is credited to that other. */
  pushCreditSeconds: 1.5,
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

/** A frame later than this, after a hidden tab or a stall, is not caught up: the game pauses instead. */
export const LONGEST_FRAME_SECONDS = 0.25

/** How often, at most, the screen tells the phones the state of the game. */
export const SUMO_STATE_REPORT_SECONDS = 0.2
