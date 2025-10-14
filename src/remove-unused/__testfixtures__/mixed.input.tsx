import { Button, Icon, Text } from 'native-base'
import { useCallback, useState } from 'react'

export function Component() {
  const [value, setValue] = useState('')
  const temp = 'unused'
  const config = { enabled: true }

  return (
    <Text>
      Value: {value}
      Config: {config.enabled ? 'on' : 'off'}
    </Text>
  )
}
