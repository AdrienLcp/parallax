import type { AlcoveCalibration } from './alcove-calibration'

/** Where the players stand: centred, about 1.5 m from the screen. */
const PLAYERS_DISTANCE_METRES = 1.5
/** A 27" 9:16 screen (the likely HLD 27"), 23.5 inches tall. */
const SCREEN_HEIGHT_METRES = 0.598

/**
 * Traced by eye on the unit on 2026-11-25, from the players' spot
 * (`docs/display-calibration/2026-11-25.json`), then checked with a frame
 * the player wedged in the box at five depths
 * (`docs/display-calibration/2026-11-25-contact.json`): every contact landed
 * within 0.5 % of the screen of this solve, the back left wall within 1 %.
 * The back wall's bottom corners are the floor's back corners.
 */
export const MEASURED_ALCOVE: AlcoveCalibration = {
  back: {
    bottomLeft: { x: 0.12176, y: 0.90885 },
    bottomRight: { x: 0.87315, y: 0.9026 },
    topLeft: { x: 0.1162, y: 0.09427 },
    topRight: { x: 0.87824, y: 0.09505 }
  },
  eyeDistance: PLAYERS_DISTANCE_METRES / SCREEN_HEIGHT_METRES,
  front: {
    floorLeft: { x: 0.04667, y: 0.97911 },
    floorRight: { x: 0.96815, y: 0.97885 },
    roofLeft: { x: 0.04528, y: 0.02354 },
    roofRight: { x: 0.9575, y: 0.0225 }
  }
}
