import { Badge } from 'native-base'

export function Example() {
  return (
    <>
      {/* Text badge */}
      <Badge>New</Badge>

      {/* Badge with expression */}
      <Badge>{count}</Badge>

      {/* Badge with colorScheme (maps to state) */}
      <Badge colorScheme="success">Success</Badge>

      {/* Badge with size and transparent */}
      <Badge size="lg" transparent>
        Large
      </Badge>

      {/* Indicator dot pattern (no text, just styles) */}
      <Badge
        rounded="full"
        p="0"
        w="12px"
        h="12px"
        bg="icon.brand"
        position="absolute"
        top="0"
        right="0"
      />

      {/* Badge with testID */}
      <Badge testID="status-badge">Active</Badge>

      {/* Badge with layout props */}
      <Badge mt="sm" ml="xs">
        Beta
      </Badge>
    </>
  )
}
