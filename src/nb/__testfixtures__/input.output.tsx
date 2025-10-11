import { Input } from '@hb-frontend/app/src/components/nordlys/Input'
import { space } from '@hb-frontend/nordlys'
import { StyleSheet, View } from 'react-native'

export function Example() {
  return (
    <>
      {/* Basic Input */}
      <Input value={name} label="Enter name" onChange={setName} />
      {/* Input with keyboard type */}
      <Input value={email} keyboardType="email-address" label="Email address" onChange={setEmail} />
      {/* Input with testID */}
      <Input value={password} testID="password-input" label="Password" onChange={setPassword} />
      {/* Input with layout props */}
      <View style={styles.input3}>
        <Input value={search} label="Search" onChange={setSearch} />
      </View>
      {/* Input with complex props (will warn) */}
      <Input
        value={phone}
        InputLeftElement={<Icon name="Phone" />}
        label="Phone"
        onChange={setPhone}
      />
    </>
  )
}

const styles = StyleSheet.create({
  input3: {
    marginTop: space.md,
    marginBottom: space.sm,
  },
})
