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
  maximumDriveSpeed: 0.9,
  restitution: 0.9,
  roundsToWin: 3,
  spawnRadius: 0.55,
  topRadius: 0.085
} as const

/** The screen steps the simulation at this fixed rate, whatever its display refresh. */
export const SUMO_STEP_SECONDS = 1 / 60
