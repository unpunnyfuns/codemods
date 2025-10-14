import type { PreventSecondApplicationSheetProps } from './types'

it.each<{ variant: PreventSecondApplicationSheetProps['variant'] }>([
  { variant: 'in_progress' },
  { variant: 'waiting' },
])('renders $variant sheet info', ({ variant }) => {
  console.log(variant)
})
