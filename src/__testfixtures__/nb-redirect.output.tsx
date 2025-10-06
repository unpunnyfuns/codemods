import type { ButtonProps } from '@org/common/src/components/native-base'
import { Box, Button } from '@org/common/src/components/native-base'
import { View } from 'react-native'

export function MyComponent() {
  return (
    <View>
      <Box>
        <Button>Click me</Button>
      </Box>
    </View>
  )
}
