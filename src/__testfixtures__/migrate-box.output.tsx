import { View, StyleSheet } from 'react-native';
import { space, color, radius } from '@hb-frontend/nordlys';

export function MyComponent() {
  return (
    <>
      <View style={styles.box0}>
        Content 1
      </View>
      <View flex={1} style={styles.box1}>
        Content 2
      </View>
      <View style={styles.box2}>
        Content 3
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  box0: {
    width: "100%",
    padding: space.lg,
    backgroundColor: color.background.secondary,
    borderRadius: radius.md
  },

  box1: {
    marginBottom: space.xl,
    backgroundColor: color.white.HW1
  },

  box2: {
    backgroundColor: color.background.secondary,
    paddingHorizontal: space.sm,
    borderRadius: 16
  }
});
