import { Avatar } from '@source/components'

export function MyComponent() {
  return (
    <>
      <Avatar iconName="user" size="md" bgColor="blue" />
      <Avatar imageUri="https://example.com/avatar.jpg" size="lg" isSecondaryColor />
      <Avatar imageSource={{ uri: 'local.jpg' }} size="sm" placeholder />
      <Avatar letters="AB" lettersColor="white" size="md" />
    </>
  )
}
