import { Box } from '@org/common/src/components/atoms/Box'
import type { ButtonProps } from '@org/common/src/components/atoms/Button'
import { Button as Btn } from '@org/common/src/components/atoms/Button'
import type { TypographyProps } from '@org/common/src/components/atoms/Typography'
import { Typography } from '@org/common/src/components/atoms/Typography'
import { SomeOtherComponent } from '@org/common/src/other'

export function MyComponent(props: ButtonProps) {
  return (
    <Box>
      <Btn>Click me</Btn>
      <Typography>Hello</Typography>
      <SomeOtherComponent />
    </Box>
  )
}
