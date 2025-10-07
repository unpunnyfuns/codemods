import { Text, Pressable, StyleSheet } from 'react-native';

import { color } from '@hb-frontend/nordlys';

export function MyComponent() {
  return (
    <>
      <Pressable onPress={() => {}} accessibilityRole='button' style={styles.pressable0}>
        <Text>Simple pressable</Text>
      </Pressable>
      <Pressable accessibilityRole="link" onPress={() => {}} style={styles.pressable1}>
        <Text>Custom role</Text>
      </Pressable>
      <Pressable onPress={() => {}} accessibilityRole='button'>
        <Text>With pseudo props</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  pressable0: {
    backgroundColor: color.blue['500'],
    padding: 4,
    margin: 2
  },

  pressable1: {
    marginTop: 8
  }
});
