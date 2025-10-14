import { Button, Icon, Text } from 'native-base'
import { useCallback, useEffect, useState } from 'react'

export function Example() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    console.log(count)
  }, [count])

  return <Text>Count: {count}</Text>
}
