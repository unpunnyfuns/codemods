import { Text } from 'native-base'
import { useState } from 'react'

export function Component() {
  const [value, setValue] = useState('')
  const config = { enabled: true }

  return (
    <Text>
      Value: {value}
      Config: {config.enabled ? 'on' : 'off'}
    </Text>
  )
}
