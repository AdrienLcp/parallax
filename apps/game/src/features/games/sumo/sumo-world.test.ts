import { readFileSync } from 'node:fs'

import {
  type ContrastPair,
  findContrastFailures,
  WCAG_AA
} from '@adrienlcp/styles/contrast'
import { expect, it } from 'vitest'

const WORLD = readFileSync(new URL('sumo-world.sass', import.meta.url), 'utf8')

const PAIRS: ContrastPair[] = [
  {
    background: '--host-backdrop',
    foreground: '--host-ink-on-light',
    minimum: WCAG_AA.text
  },
  {
    background: '--host-backdrop',
    foreground: '--host-ink-soft-on-light',
    minimum: WCAG_AA.text
  },
  {
    background: '--host-ground',
    foreground: '--host-ink',
    minimum: WCAG_AA.text
  },
  {
    background: '--host-ground',
    foreground: '--host-ink-soft',
    minimum: WCAG_AA.text
  },
  {
    background: '--host-panel',
    foreground: '--host-ink',
    minimum: WCAG_AA.text
  },
  {
    background: '--host-panel',
    foreground: '--host-ink-soft',
    minimum: WCAG_AA.text
  },
  {
    background: '--host-accent',
    foreground: '--host-accent-ink',
    minimum: WCAG_AA.text
  },
  {
    background: '--host-plaque',
    foreground: '--host-plaque-ink',
    minimum: WCAG_AA.text
  },
  {
    background: '--host-qr-quiet',
    foreground: '--host-qr-ink',
    minimum: WCAG_AA.text
  }
  // No line pair on the backdrop: on the light paper the brass rules are
  // inlay that carries no meaning (Adrien approved them in mock E, 2026-11-26).
]

it('[contrast] the host reads in the sumo world', () => {
  expect(findContrastFailures(WORLD, PAIRS)).toEqual([])
})
