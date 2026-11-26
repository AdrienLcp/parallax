import type React from 'react'

import type { GamePreviewProps } from '../game-definition'

import './claw-preview.sass'

/**
 * The empty alcove the claw's scene opens on: the backdrop shows through, and
 * the scene adds the pile, the rails and the claws once it loads. Nothing to
 * frame, so nothing jumps when it takes over.
 */
export const ClawPreview: React.FC<GamePreviewProps> = () => (
  <div className='claw-preview' />
)
