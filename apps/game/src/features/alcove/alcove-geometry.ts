import type { ScreenShare } from './alcove-calibration'

/** A point of the scene, in alcove units: its opening is 1 wide. */
export type AlcovePoint = {
  /** Across, from the box's centre toward the players' right. */
  readonly x: number
  /** Up, from the box's floor. */
  readonly y: number
  /** Out of the box toward the players: 0 at its opening, `-depth` at its back wall. */
  readonly z: number
}

/**
 * The alcove solved as a box seen by one eye through the screen: everything a
 * game needs to stand objects in it and see them where the optics show it.
 */
export type AlcoveGeometry = {
  /** From the opening to the back wall, in alcove units. */
  readonly depth: number
  /** The players' eye, in the scene's axes. */
  readonly eye: AlcovePoint
  /** From the eye to the screen, in screen heights. */
  readonly eyeDistance: number
  /** The fit's root-mean-square miss over the traced corners, in screen heights. */
  readonly fitError: number
  /** From the floor to the roof, in alcove units. */
  readonly height: number
  /** Where the eye's straight-ahead line meets the screen. */
  readonly principalPoint: ScreenShare
}
