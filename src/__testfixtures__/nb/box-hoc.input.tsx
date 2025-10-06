import { Box } from 'native-base'
import Animated from 'react-native-reanimated'

const AnimatedBox = Animated.createAnimatedComponent(Box)

export function Example() {
  return (
    <>
      <Box mb="lg">Direct Box</Box>
      <AnimatedBox mt="md" p="sm">
        Animated Box
      </AnimatedBox>
    </>
  )
}
