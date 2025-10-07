/**
 * Prop mappings for Button component migration
 *
 * NativeBase/Common Button → Nordlys Button
 * Note: Custom transformation logic handles leftIcon extraction and children→text conversion
 */

import * as commonDropProps from './common/drop-props.js'

// STYLE_PROPS: None - Button doesn't accept style props in Nordlys
export const STYLE_PROPS = {}

// TRANSFORM_PROPS: Renamed on element
export const TRANSFORM_PROPS = {
  isDisabled: 'disabled',
}

// DIRECT_PROPS: Passed through unchanged
export const DIRECT_PROPS = [
  'size',
  'variant',
  'onPress',
  'testID',
  'isLoading',
  'type', // May already exist, preserve it
]

// DROP_PROPS: Removed entirely
export const DROP_PROPS = [
  ...commonDropProps.COMMON,

  // Button-specific props not supported in Nordlys
  'leftIcon', // Extracted to icon prop via custom logic
  'rightIcon', // Not supported
  '_text',
  '_loading',

  // Style props not supported on Button
  'm',
  'mt',
  'mb',
  'ml',
  'mr',
  'mx',
  'my',
  'margin',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'p',
  'pt',
  'pb',
  'pl',
  'pr',
  'px',
  'py',
  'padding',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'w',
  'h',
  'width',
  'height',
  'bg',
  'bgColor',
  'backgroundColor',
]
