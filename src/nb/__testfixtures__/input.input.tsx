import { Input } from 'native-base'

export function Example() {
  return (
    <>
      {/* Basic Input */}
      <Input placeholder="Enter name" value={name} onChangeText={setName} />

      {/* Input with keyboard type */}
      <Input
        placeholder="Email address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      {/* Input with testID */}
      <Input
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        testID="password-input"
      />

      {/* Input with layout props */}
      <Input placeholder="Search" value={search} onChangeText={setSearch} mt="md" mb="sm" />

      {/* Input with complex props (will warn) */}
      <Input
        placeholder="Phone"
        value={phone}
        onChangeText={setPhone}
        InputLeftElement={<Icon name="Phone" />}
      />
    </>
  )
}
