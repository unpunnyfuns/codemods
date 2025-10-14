import { useRoute } from '@hb-frontend/app/src/navigation/useRoute'
import type { PhoneNumberFormValues, Screens } from '@hb-frontend/types'
import { useForm } from 'react-hook-form'

export function Component() {
  const form = useForm<PhoneNumberFormValues>()
  const route = useRoute<Screens.UPDATE_PHONE_NUMBER>()

  return (
    <div>
      {form.getValues()}
      {route.name}
    </div>
  )
}
