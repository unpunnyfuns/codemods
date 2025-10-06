import { Typography } from '@source/components'

export function Example() {
  return (
    <>
      {/* Simple with type/size/color - should work */}
      <Typography type="headline" size="sm" color="text.quaternary-alternate">
        Simple headline
      </Typography>

      {/* With spacing props - needs View wrapper */}
      <Typography type="label" size="sm" color="text.secondary" px="sm" fontWeight="normal">
        Label with spacing
      </Typography>

      {/* With margin spacing */}
      <Typography ml="-1" size="lg" type="body" color="text.primary">
        Body with margin
      </Typography>

      {/* With conditional mb */}
      <Typography
        type="label"
        size="sm"
        color="text.tertiary"
        mb={someCondition ? 'xs' : undefined}
      >
        Conditional margin
      </Typography>

      {/* With textAlign (allowed) */}
      <Typography type="heading" size="sm" textAlign="center" mt="sm">
        Centered heading
      </Typography>
    </>
  )
}
