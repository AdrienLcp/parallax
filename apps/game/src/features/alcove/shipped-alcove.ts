import type { AlcoveGeometry } from './alcove-geometry'
import { MEASURED_ALCOVE } from './measured-alcove'
import { solveAlcove } from './solve-alcove'

/** The alcove every game stands its scene in. */
export const SHIPPED_ALCOVE: AlcoveGeometry = solveAlcove(MEASURED_ALCOVE)
