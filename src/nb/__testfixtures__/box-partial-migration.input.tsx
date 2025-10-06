import { Box } from 'native-base'

export function Example() {
  return (
    <>
      <Box p="lg" bg="blue.500">
        Successfully migrated
      </Box>
      <Box textAlign="left" p="md">
        Skipped due to textAlign
      </Box>
    </>
  )
}
