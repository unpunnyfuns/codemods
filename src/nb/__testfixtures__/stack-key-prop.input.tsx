import { HStack, VStack } from 'native-base'

export function ListComponent() {
  const items = [1, 2, 3]

  return (
    <>
      {items.map((item) => (
        <VStack key={item} space="md">
          <HStack key={`h-${item}`} space="sm">
            <div>Item {item}</div>
          </HStack>
        </VStack>
      ))}
    </>
  )
}
