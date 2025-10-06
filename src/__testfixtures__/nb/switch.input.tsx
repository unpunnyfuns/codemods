import { Switch, Typography } from '@source/components'

export function MyComponent() {
  return (
    <>
      <Switch
        testID="switch1"
        switchPosition="right"
        hStackProps={{ justifyContent: 'space-between' }}
        label="Additional info"
        isChecked={true}
        onToggle={(val) => console.log(val)}
      >
        <Typography type="heading" size="sm">
          Main label
        </Typography>
      </Switch>

      <Switch isChecked={false} onToggle={() => {}} isDisabled>
        Simple switch
      </Switch>
    </>
  )
}
