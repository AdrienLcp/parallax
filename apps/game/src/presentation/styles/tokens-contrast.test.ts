import { readFileSync } from 'node:fs'

import {
  type ContrastPair,
  findContrastFailures,
  WCAG_AA
} from '@adrienlcp/styles/contrast'
import { expect, it } from 'vitest'

const TOKENS = readFileSync(new URL('_tokens.sass', import.meta.url), 'utf8')

const PAIRS: ContrastPair[] = [
  { background: '--ground', foreground: '--ink', minimum: WCAG_AA.text },
  { background: '--ground', foreground: '--ink-muted', minimum: WCAG_AA.text },
  { background: '--ink', foreground: '--ground', minimum: WCAG_AA.nonText },
  { background: '--ground', foreground: '--focus', minimum: WCAG_AA.nonText },
  {
    background: '--ground',
    foreground: '--rule-strong',
    minimum: WCAG_AA.nonText
  },
  { background: '--selection', foreground: '--ink', minimum: WCAG_AA.text }
]

it('[contrast] every ink reads on every surface, in both themes', () => {
  expect(findContrastFailures(TOKENS, PAIRS)).toEqual([])
})
