import { type PlanarVector, pointsOnCircle } from '@/helpers/planar-vector'

import { SUMO_TUNING } from './sumo-tuning'

/** Where each of `count` tops waits for a round to start, evenly around the centre, in seating order. */
export const roundMarksOf = (count: number): readonly PlanarVector[] =>
  pointsOnCircle({ count, radius: SUMO_TUNING.spawnRadius })
