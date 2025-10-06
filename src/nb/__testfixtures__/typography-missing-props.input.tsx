import { Typography } from '@source/components'

export function Example() {
  return (
    <>
      <Typography>No type or size</Typography>
      <Typography type="body">Has type, no size</Typography>
      <Typography size="lg">Has size, no type</Typography>
    </>
  )
}
