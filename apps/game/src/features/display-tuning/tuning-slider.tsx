import type React from 'react'
import {
  Label,
  Slider,
  SliderOutput,
  SliderThumb,
  SliderTrack,
  useLocale
} from 'react-aria-components'

import type { NumberRange } from './display-tuning'

/** How a slider writes its value: an angle, a speed, a share, a factor, or a plain number. */
export type TuningValueFormat =
  | 'decimal'
  | 'degrees'
  | 'degreesPerSecond'
  | 'percent'
  | 'times'

const formatTuningValue = ({
  format,
  locale,
  step,
  value
}: {
  format: TuningValueFormat
  locale: string
  step: number
  value: number
}): string => {
  switch (format) {
    case 'degrees':
      return `${Math.round(value)}°`
    case 'degreesPerSecond':
      return `${Math.round(value)}°/s`
    case 'percent':
      return new Intl.NumberFormat(locale, { style: 'percent' }).format(value)
    case 'times':
      return `×${new Intl.NumberFormat(locale, { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(value)}`
    case 'decimal': {
      const digits = step < 0.1 ? 2 : 1
      return new Intl.NumberFormat(locale, {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits
      }).format(value)
    }
  }
}

type TuningSliderProps = {
  format: TuningValueFormat
  label: string
  onChange: (value: number) => void
  range: NumberRange
  value: number
}

/** One numeric setting on one line: its name, a brass track the mouse drags, and its value. */
export const TuningSlider: React.FC<TuningSliderProps> = ({
  format,
  label,
  onChange,
  range,
  value
}) => {
  const { locale } = useLocale()

  return (
    <Slider
      className='tuning-slider'
      maxValue={range.highest}
      minValue={range.lowest}
      onChange={(next) => onChange(Array.isArray(next) ? next[0] : next)}
      step={range.step}
      value={value}
    >
      <Label className='tuning-slider-label'>{label}</Label>
      <SliderTrack className='tuning-slider-track'>
        {({ state }) => (
          <>
            <span
              className='tuning-slider-fill'
              style={{ '--fill': state.getThumbPercent(0) }}
            />
            <SliderThumb className='tuning-slider-thumb' />
          </>
        )}
      </SliderTrack>
      <SliderOutput className='tuning-slider-value'>
        {formatTuningValue({ format, locale, step: range.step, value })}
      </SliderOutput>
    </Slider>
  )
}
