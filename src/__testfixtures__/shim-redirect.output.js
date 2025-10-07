import { Box, Button } from '@org/common/src/components/native-base';
import { Typography } from '@org/common/src/components/native-base';
import { SomeOtherComponent } from '@org/common/src/other'

export function MyComponent() {
  return (
    <Box>
      <Button>Click me</Button>
      <Typography>Hello</Typography>
      <SomeOtherComponent />
    </Box>
  )
}
