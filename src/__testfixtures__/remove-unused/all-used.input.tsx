import { Button, Text } from 'native-base'
import { useState } from 'react'

export function Component() {
  const [count, setCount] = useState(0)
  const doubled = count * 2

  return (
    <Button onPress={() => setCount(count + 1)}>
      <Text>
        Count: {count}, Doubled: {doubled}
      </Text>
    </Button>
  )
}
