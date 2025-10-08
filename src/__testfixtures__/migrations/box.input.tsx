import { Box } from 'native-base'

export function MyComponent() {
  return (
    <>
      <Box width="100%" p="lg" bgColor="background.secondary" borderRadius="md">
        Content 1
      </Box>
      <Box mb="xl" bg="white.900" flex={1}>
        Content 2
      </Box>
      <Box backgroundColor="input.backgroundDefault" px="sm" rounded={16}>
        Content 3
      </Box>
    </>
  )
}
