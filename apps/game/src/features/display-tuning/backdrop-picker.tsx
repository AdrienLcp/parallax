import type React from 'react'
import { Radio, RadioGroup } from 'react-aria-components'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import {
  BACKDROP_PRESETS,
  type Backdrop,
  backdropColorOf,
  backdropFrom,
  presetOf
} from './display-tuning'

type BackdropPickerProps = {
  /** The backdrop as `#rrggbb`, for the colour input. */
  hex: string
  onChange: (backdrop: Backdrop) => void
  value: Backdrop
}

/** A row of backdrop swatches, darkest first, closed by a free colour picker. */
export const BackdropPicker: React.FC<BackdropPickerProps> = ({
  hex,
  onChange,
  value
}) => {
  const translate = useTranslate()
  const preset = presetOf(value)
  const choose = (picked: string) => {
    const backdrop = backdropFrom(picked)
    if (backdrop !== null) onChange(backdrop)
  }

  return (
    <div className='backdrop-picker'>
      <RadioGroup
        aria-label={translate('tuning.backdrop')}
        className='backdrop-presets'
        onChange={choose}
        orientation='horizontal'
        value={preset}
      >
        {BACKDROP_PRESETS.map((preset) => (
          <Radio
            aria-label={translate(`tuning.backdrops.${preset}`)}
            className='backdrop-swatch'
            key={preset}
            style={{ '--swatch': backdropColorOf(preset) }}
            value={preset}
          >
            <span
              className='swatch-chip'
              title={translate(`tuning.backdrops.${preset}`)}
            />
          </Radio>
        ))}
      </RadioGroup>
      <label
        className='backdrop-swatch backdrop-custom'
        data-selected={preset === null ? true : undefined}
        title={translate('tuning.backdrops.custom')}
      >
        <input
          aria-label={translate('tuning.backdrops.custom')}
          className='swatch-chip'
          onChange={(event) => choose(event.target.value)}
          type='color'
          value={hex}
        />
      </label>
    </div>
  )
}
