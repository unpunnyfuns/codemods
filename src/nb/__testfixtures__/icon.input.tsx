import { Icon } from '@source/components'

export function Example() {
  return (
    <>
      {/* Basic usage */}
      <Icon name="CheckCircleSolid" width={5} height={5} color="icon.primary" />

      {/* With token sizes */}
      <Icon name="XCircleSolid" width="4" height="4" color="icon.secondary" />

      {/* With testID */}
      <Icon name="ArrowRight" width={20} height={20} color="text.primary" testID="arrow-icon" />

      {/* Color mapping */}
      <Icon name="Star" width={5} height={5} color="blue.500" />

      {/* With spread (will warn) */}
      <Icon name="Heart" width={5} height={5} color="red.500" {...otherProps} />
    </>
  )
}
