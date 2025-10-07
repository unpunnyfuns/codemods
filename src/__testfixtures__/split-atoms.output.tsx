import { SomeOtherComponent } from '@org/common/src/other'

import { Box } from '@org/common/src/components/atoms/Box';
import { Button as Btn } from '@org/common/src/components/atoms/Button';
import { Typography } from '@org/common/src/components/atoms/Typography';
import type { ButtonProps } from '@org/common/src/components/atoms/Button';
import type { TypographyProps } from '@org/common/src/components/atoms/Typography';

export function MyComponent(props: ButtonProps) {
  return (
    <Box>
      <Btn>Click me</Btn>
      <Typography>Hello</Typography>
      <SomeOtherComponent />
    </Box>
  )
}
