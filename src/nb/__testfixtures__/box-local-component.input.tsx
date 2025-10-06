import { Box, HStack } from 'native-base'
import { FC } from 'react'

type SectionProps = {
  testID?: string
  title: string
  value: string
}

// Local component that uses Box in its JSX - should NOT be processed
const Section: FC<SectionProps> = ({ testID, title, value }) => {
  return (
    <HStack mt="lg">
      <Box w="24px" mt="2xs">
        <Icon name="test" />
      </Box>
      <HStack ml="sm" testID={testID}>
        <Text>{title}</Text>
        <Text>{value}</Text>
      </HStack>
    </HStack>
  )
}

export function Example() {
  return (
    <Box p="lg">
      <Section testID="test-section" title="Title" value="Value" />
    </Box>
  )
}
