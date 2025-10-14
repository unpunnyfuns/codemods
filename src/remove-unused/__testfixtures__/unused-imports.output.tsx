import { Text } from 'native-base'
import { useEffect, useState } from 'react'

export function Example() {
  const [count, _setCount] = useState(0)

  useEffect(() => {
    console.log(count)
  }, [count])

  return <Text>Count: {count}</Text>
}
