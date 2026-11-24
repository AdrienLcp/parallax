import type { AlcoveCalibration } from './alcove-calibration'

/** Where the players stand: centred, about 1.5 m from the screen. */
const PLAYERS_DISTANCE_METRES = 1.5
/** A 27" 9:16 screen (the likely HLD 27"), 23.5 inches tall. */
const SCREEN_HEIGHT_METRES = 0.598

/**
 * The first rough calibration, traced by eye on the unit on 2026-11-24
 * (`docs/display-calibration/2026-11-24.json`). The back wall's bottom
 * corners are the floor's back corners.
 */
export const MEASURED_ALCOVE: AlcoveCalibration = {
  back: {
    bottomLeft: { x: 0.13472, y: 0.90391 },
    bottomRight: { x: 0.86435, y: 0.90417 },
    topLeft: { x: 0.12917, y: 0.09714 },
    topRight: { x: 0.85833, y: 0.09479 }
  },
  eyeDistance: PLAYERS_DISTANCE_METRES / SCREEN_HEIGHT_METRES,
  front: {
    floorLeft: { x: 0.05407, y: 0.97573 },
    floorRight: { x: 0.96815, y: 0.97469 },
    roofLeft: { x: 0.04574, y: 0.02536 },
    roofRight: { x: 0.95657, y: 0.02198 }
  }
}
