import type React from 'react'

import type { GamePreviewProps } from '../game-definition'

import './globe-preview.sass'

/**
 * The empty alcove the globe's scene opens on: the backdrop shows through, and
 * the scene adds the globe once it loads. Nothing to
 * frame, so nothing jumps when it takes over.
 */
export const GlobePreview: React.FC<GamePreviewProps> = () => (
  <div className='globe-preview' />
)
