import type React from 'react'
import { Button, Radio, RadioGroup, ToggleButton } from 'react-aria-components'

import { ORBIT_MODES } from '@/features/games/sumo/arena-orbit'
import type { ArenaTuning } from '@/features/games/sumo/arena-tuning'
import { currentMoment } from '@/infrastructure/clock'
import { downloadTextFile } from '@/infrastructure/download'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { APP_BUILD } from './app-build'
import { BackdropPicker } from './backdrop-picker'
import {
  type DisplayTuning,
  HUD_SCALE_RANGE,
  type HudTuning,
  LENS_RANGES,
  LIGHTING_RANGES,
  MOTION_RANGES,
  SHAPE_RANGES
} from './display-tuning'
import {
  resetDisplayTuning,
  setTuningPanelOpen,
  updateDisplayTuning
} from './display-tuning-store'
import { tuningFileNameOf, tuningFileOf } from './tuning-file'
import { TuningSlider } from './tuning-slider'

import './tuning-panel.sass'

/** Writes one field of one of the arena's groups. */
const setArena =
  <Group extends keyof ArenaTuning>(group: Group) =>
  <Key extends keyof ArenaTuning[Group]>(key: Key) =>
  (value: ArenaTuning[Group][Key]) =>
    updateDisplayTuning((tuning) => ({
      ...tuning,
      arena: {
        ...tuning.arena,
        [group]: { ...tuning.arena[group], [key]: value }
      }
    }))

const setLens = setArena('lens')
const setMotion = setArena('motion')
const setShape = setArena('shape')
const setLighting = setArena('lighting')

const setHud =
  <Key extends keyof HudTuning>(key: Key) =>
  (value: HudTuning[Key]) =>
    updateDisplayTuning((tuning) => ({
      ...tuning,
      hud: { ...tuning.hud, [key]: value }
    }))

const downloadTuning = (tuning: DisplayTuning, backdropHex: string) => {
  const savedAt = currentMoment()
  const file = tuningFileOf({ backdropHex, build: APP_BUILD, savedAt, tuning })
  downloadTextFile({
    fileName: tuningFileNameOf(savedAt),
    text: `${JSON.stringify(file, null, 2)}\n`,
    type: 'application/json'
  })
}

type TuningPanelProps = {
  /** The backdrop as `#rrggbb`, resolved from the page. */
  backdropHex: string
  tuning: DisplayTuning
}

/**
 * The display's tuning panel, driven by the mouse: backdrop, camera, motion,
 * scene and HUD apply at once and are kept on this display; the tuning
 * downloads as a JSON file, or goes back to the shipped values.
 */
export const TuningPanel: React.FC<TuningPanelProps> = ({
  backdropHex,
  tuning
}) => {
  const translate = useTranslate()
  const { lens, lighting, motion, shape } = tuning.arena

  return (
    <aside aria-label={translate('tuning.title')} className='tuning-panel'>
      <header className='tuning-head'>
        <h2 className='tuning-title'>{translate('tuning.title')}</h2>
        <Button
          aria-label={translate('tuning.close')}
          className='tuning-close'
          onPress={() => setTuningPanelOpen(false)}
        >
          <svg aria-hidden='true' viewBox='0 0 24 24'>
            <path d='M6 6 L18 18 M18 6 L6 18' />
          </svg>
        </Button>
      </header>

      <section className='tuning-group'>
        <h3 className='tuning-group-title'>{translate('tuning.backdrop')}</h3>
        <BackdropPicker
          hex={backdropHex}
          onChange={(backdrop) =>
            updateDisplayTuning((current) => ({ ...current, backdrop }))
          }
          value={tuning.backdrop}
        />
      </section>

      <section className='tuning-group'>
        <h3 className='tuning-group-title'>{translate('tuning.camera')}</h3>
        <TuningSlider
          format='degrees'
          label={translate('tuning.pitch')}
          onChange={setLens('pitchDegrees')}
          range={LENS_RANGES.pitchDegrees}
          value={lens.pitchDegrees}
        />
        <TuningSlider
          format='degrees'
          label={translate('tuning.fieldOfView')}
          onChange={setLens('fieldOfViewDegrees')}
          range={LENS_RANGES.fieldOfViewDegrees}
          value={lens.fieldOfViewDegrees}
        />
        <TuningSlider
          format='percent'
          label={translate('tuning.fill')}
          onChange={setLens('frameFill')}
          range={LENS_RANGES.frameFill}
          value={lens.frameFill}
        />
        <TuningSlider
          format='percent'
          label={translate('tuning.height')}
          onChange={setLens('verticalCentre')}
          range={LENS_RANGES.verticalCentre}
          value={lens.verticalCentre}
        />
      </section>

      <section className='tuning-group'>
        <h3 className='tuning-group-title'>{translate('tuning.motion')}</h3>
        <RadioGroup
          aria-label={translate('tuning.orbit')}
          className='tuning-segments'
          onChange={(picked) => {
            const mode = ORBIT_MODES.find((orbit) => orbit === picked)
            if (mode !== undefined) setMotion('orbit')(mode)
          }}
          orientation='horizontal'
          value={motion.orbit}
        >
          {ORBIT_MODES.map((mode) => (
            <Radio className='tuning-segment' key={mode} value={mode}>
              {translate(`tuning.orbits.${mode}`)}
            </Radio>
          ))}
        </RadioGroup>
        <TuningSlider
          format='degreesPerSecond'
          label={translate('tuning.speed')}
          onChange={setMotion('orbitDegreesPerSecond')}
          range={MOTION_RANGES.orbitDegreesPerSecond}
          value={motion.orbitDegreesPerSecond}
        />
        <TuningSlider
          format='degrees'
          label={translate('tuning.sway')}
          onChange={setMotion('swayDegrees')}
          range={MOTION_RANGES.swayDegrees}
          value={motion.swayDegrees}
        />
      </section>

      <section className='tuning-group'>
        <h3 className='tuning-group-title'>{translate('tuning.scene')}</h3>
        <TuningSlider
          format='times'
          label={translate('tuning.drum')}
          onChange={setShape('drumHeightScale')}
          range={SHAPE_RANGES.drumHeightScale}
          value={shape.drumHeightScale}
        />
        <TuningSlider
          format='times'
          label={translate('tuning.tops')}
          onChange={setShape('topHeightScale')}
          range={SHAPE_RANGES.topHeightScale}
          value={shape.topHeightScale}
        />
        <TuningSlider
          format='decimal'
          label={translate('tuning.shadow')}
          onChange={setLighting('shadowOpacity')}
          range={LIGHTING_RANGES.shadowOpacity}
          value={lighting.shadowOpacity}
        />
        <TuningSlider
          format='decimal'
          label={translate('tuning.light')}
          onChange={setLighting('keyLightIntensity')}
          range={LIGHTING_RANGES.keyLightIntensity}
          value={lighting.keyLightIntensity}
        />
      </section>

      <section className='tuning-group'>
        <h3 className='tuning-group-title'>{translate('tuning.hud')}</h3>
        <TuningSlider
          format='times'
          label={translate('tuning.size')}
          onChange={setHud('scale')}
          range={HUD_SCALE_RANGE}
          value={tuning.hud.scale}
        />
        <div className='tuning-segments'>
          <ToggleButton
            className='tuning-segment'
            isSelected={tuning.hud.showHeader}
            onChange={setHud('showHeader')}
          >
            {translate('tuning.header')}
          </ToggleButton>
          <ToggleButton
            className='tuning-segment'
            isSelected={tuning.hud.showRoster}
            onChange={setHud('showRoster')}
          >
            {translate('tuning.roster')}
          </ToggleButton>
          <ToggleButton
            className='tuning-segment'
            isSelected={tuning.hud.showQr}
            onChange={setHud('showQr')}
          >
            {translate('tuning.qr')}
          </ToggleButton>
        </div>
      </section>

      <footer className='tuning-foot'>
        <Button
          className='tuning-download'
          onPress={() => downloadTuning(tuning, backdropHex)}
        >
          <svg aria-hidden='true' viewBox='0 0 24 24'>
            <path d='M12 4 V15 M7 10.5 L12 15.5 L17 10.5 M5 20 H19' />
          </svg>
          {translate('tuning.download')}
        </Button>
        <Button
          aria-label={translate('tuning.reset')}
          className='tuning-reset'
          onPress={resetDisplayTuning}
        >
          <svg aria-hidden='true' viewBox='0 0 24 24'>
            <title>{translate('tuning.reset')}</title>
            <path d='M5 12 A7 7 0 1 0 7.05 7.05 M5 4 V8.5 H9.5' />
          </svg>
        </Button>
      </footer>
    </aside>
  )
}
