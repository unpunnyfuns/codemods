import { Icon } from '@hb-frontend/common/src/components'
import { useTranslation } from 'react-i18next'

import { Button } from '@hb-frontend/app/src/components/nordlys/Button'

export function MyComponent() {
  const { t } = useTranslation()
  const text = 'Submit'

  return (
    <>
      <Button
        testID="button1"
        variant="secondary"
        size="md"
        onPress={() => {}}
        icon={'PlusOutlined'}
        text={t('addNew')}
        type='solid' />
      <Button
        variant="primary"
        size="lg"
        onPress={() => {}}
        disabled
        text={'Simple text'}
        type='solid' />
      <Button variant="secondary" size="md" onPress={() => {}} text={text} type='solid' />
    </>
  )
}
