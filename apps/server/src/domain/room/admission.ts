import { z } from 'zod'

import { seatIdSchema } from '@parallax/protocol/identifiers'

/**
 * Who a socket turned out to be once its `hello` was accepted. Kept on the
 * socket itself, since the object holding the room sleeps between frames.
 */
export const admissionSchema = z.discriminatedUnion('role', [
  z.object({ role: z.literal('screen') }),
  z.object({ role: z.literal('player'), seatId: seatIdSchema })
])

export type Admission = z.infer<typeof admissionSchema>
