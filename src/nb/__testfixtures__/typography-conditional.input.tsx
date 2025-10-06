import { Typography } from '@source/components'

export function Example({ isActive }: { isActive: boolean }) {
  return (
    <Typography type="body" size="md" color={isActive ? 'text.brand' : 'text.primary'}>
      Conditional color
    </Typography>
  )
}
