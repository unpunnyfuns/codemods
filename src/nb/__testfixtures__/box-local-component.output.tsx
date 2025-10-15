import { space } from '@hb-frontend/nordlys'
import { HStack } from 'native-base'
import { FC } from 'react'
import { StyleSheet, View } from 'react-native'

type SectionProps = {
  testID?: string
  title: string
  value: string
}

// Local component that uses Box in its JSX - should NOT be processed
const Section: FC<SectionProps> = ({ testID, title, value }) => {
  return (
    <HStack mt="lg">
      <View style={styles.box0}>
        <Icon name="test" />
      </View>
      <HStack ml="sm" testID={testID}>
        <Text>{title}</Text>
        <Text>{value}</Text>
      </HStack>
    </HStack>
  )
}

export function Example() {
  return (
    <View style={styles.box1}>
      <Section testID="test-section" title="Title" value="Value" />
    </View>
  )
}

const styles = StyleSheet.create({
  box0: {
    width: space['24px'],
    marginTop: space['2xs'],
  },

  box1: {
    padding: space.lg,
  },
})
