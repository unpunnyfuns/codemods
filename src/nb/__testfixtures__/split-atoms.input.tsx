import { Box, Button as Btn, Typography } from '@source/common/src/components'
import type { ButtonProps } from '@source/common/src/components/'
import { SomeOtherComponent } from '@source/common/src/other'

export function MyComponent(_props: ButtonProps) {
  return (
    <Box>
      <Btn>Click me</Btn>
      <Typography>Hello</Typography>
      <SomeOtherComponent />
    </Box>
  )
}
