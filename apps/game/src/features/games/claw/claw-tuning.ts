/** Seated players a claw game needs, and the most it takes: one claw each. */
export const CLAW_PLAYERS = { fewest: 2, most: 6 } as const

/** The game steps at this fixed rate whatever the display's refresh. */
export const CLAW_STEP_SECONDS = 1 / 120

/** A frame longer than this (a tab come back to the front) is not caught up. */
export const LONGEST_FRAME_SECONDS = 0.25

/** How often the screen tells the phones the game's state, at most. */
export const CLAW_STATE_REPORT_SECONDS = 0.2

export const CLAW_TUNING = {
  /** How fast a full stick moves a claw, in alcove units a second; a slighter tilt is much slower (`AIM_CURVE`). */
  aimSpeed: 0.6,
  /** Share of the pile that are capsules. */
  capsuleShare: 0.15,
  /** What a capsule is worth; a plush is worth 1. */
  capsuleValue: 3,
  /** A claw grips a prize whose centre lies this close to its axis, across and in depth. */
  catchRadius: 0.07,
  /** Two claws keep this far apart, axis to axis: their open prongs never cross. */
  clawGap: 0.2,
  /** Seconds the result stays on the display before the room goes back to its lobby. */
  decidedPauseSeconds: 5,
  /** How fast a claw goes down, in alcove units a second. */
  dropSpeed: 0.7,
  /** Gravity on a falling prize, in alcove units a second squared: soft, so a slip reads from across the room. */
  gravity: 3.2,
  /** How long the prongs take to close. */
  gripSeconds: 0.45,
  /** How fast a claw comes back up, in alcove units a second. */
  liftSpeed: 0.55,
  /** Once time is up, the longest the claws already down may take to finish. */
  longestFinishSeconds: 6,
  /** The prizes the pile is dealt, at most: as many as fit without crowding. */
  pileCount: 60,
  /** Once the pile is this many short of its deal, it gets `refillCount` new prizes. */
  refillBelow: 8,
  refillCount: 6,
  /** The pile is checked for a top-up this often. */
  refillSeconds: 0.5,
  /** How long the round lasts. */
  roundSeconds: 60,
  /** Chance a gripped plush slips out on the way up; a capsule is rounder. */
  slipChance: { capsule: 0.5, plush: 0.3 }
} as const
