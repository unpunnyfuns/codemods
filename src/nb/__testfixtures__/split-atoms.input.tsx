import { Box, Button as Btn, Typography } from '@org/common/src/components'
import type { ButtonProps } from '@org/common/src/components/'
import { SomeOtherComponent } from '@org/common/src/other'

export function MyComponent(_props: ButtonProps) {
  return (
    <Box>
      <Btn>Click me</Btn>
      <Typography>Hello</Typography>
      <SomeOtherComponent />
    </Box>
  )
}
