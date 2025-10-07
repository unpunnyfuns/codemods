import { Avatar } from '@hb-frontend/app/src/components/nordlys/Avatar';

export function MyComponent() {
  return (
    <>
      <Avatar
        size="md"
        icon={{
          name: "user",
          fill: 'blue'
        }} />
      <Avatar
        size="lg"
        image={{
          source: {
            uri: "https://example.com/avatar.jpg"
          }
        }} />
      <Avatar
        size="sm"
        image={{
          source: { uri: 'local.jpg' }
        }} />
      <Avatar letters="AB" lettersColor="white" size="md" />
    </>
  );
}
