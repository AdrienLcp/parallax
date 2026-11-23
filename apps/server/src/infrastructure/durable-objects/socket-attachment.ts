import { z } from 'zod'

import { admissionSchema } from '@/domain/room/admission'

/**
 * What a socket carries across the room's sleeps: who it is once admitted,
 * and when it last sent a frame.
 */
export const socketAttachmentSchema = z.object({
  admission: admissionSchema.nullable(),
  lastFrameAtMs: z.number()
})

export type SocketAttachment = z.infer<typeof socketAttachmentSchema>
