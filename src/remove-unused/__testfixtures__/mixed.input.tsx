import { Text } from 'native-base'
import { useState } from 'react'

export function Component() {
  const [value, _setValue] = useState('')
  const _temp = 'unused'
  const config = { enabled: true }

  return (
    <Text>
      Value: {value}
      Config: {config.enabled ? 'on' : 'off'}
    </Text>
  )
}
