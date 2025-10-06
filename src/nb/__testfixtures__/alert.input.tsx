import { Alert } from 'native-base'

export function Example() {
  return (
    <>
      {/* Basic Alert with compound components */}
      <Alert status="success">
        <Alert.Icon />
        <Alert.Title>Success</Alert.Title>
        <Alert.Description>Your changes have been saved</Alert.Description>
      </Alert>

      {/* Alert with expression */}
      <Alert status="error">
        <Alert.Title>Error</Alert.Title>
        <Alert.Description>{errorMessage}</Alert.Description>
      </Alert>

      {/* Alert with testID */}
      <Alert status="info" testID="info-alert">
        <Alert.Title>Information</Alert.Title>
        <Alert.Description>Please review the details below</Alert.Description>
      </Alert>

      {/* Alert with layout props */}
      <Alert status="warning" mt="md" mb="lg">
        <Alert.Icon />
        <Alert.Description>This action cannot be undone</Alert.Description>
      </Alert>
    </>
  )
}
