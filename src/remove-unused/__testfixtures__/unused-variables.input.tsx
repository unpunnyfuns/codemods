export function calculate() {
  const result = 42
  const temp = 100
  const _unused = 'never used'
  const _alsoUnused = false

  return result + temp
}

export function multipleDeclarations() {
  const a = 1,
    _b = 2,
    c = 3,
    _d = 4

  return a + c
}
