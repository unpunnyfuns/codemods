import { Switch } from '@hb-frontend/app/src/components/nordlys/Switch'
import { Typography } from '@hb-frontend/common/src/components'

export function MyComponent() {
  return (
    <>
      <Switch testID="switch1" value={true} onValueChange={(val) => console.log(val)}>
        <Switch.Label>
          <Typography type="heading" size="sm">
            Main label
          </Typography>
        </Switch.Label>
        <Switch.Description>Additional info</Switch.Description>
      </Switch>
      <Switch value={false} onValueChange={() => {}} disabled>
        <Switch.Label>Simple switch</Switch.Label>
      </Switch>
    </>
  )
}
