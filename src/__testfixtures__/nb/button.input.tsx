import { Button, Icon } from '@source/components'
import { useTranslation } from 'react-i18next'

export function MyComponent() {
  const { t } = useTranslation()
  const text = 'Submit'

  return (
    <>
      <Button
        testID="button1"
        leftIcon={<Icon name="PlusOutlined" color="icon.brand" />}
        variant="secondary"
        size="md"
        onPress={() => {}}
        mt="xl"
      >
        {t('addNew')}
      </Button>

      <Button variant="primary" size="lg" onPress={() => {}} isDisabled>
        Simple text
      </Button>

      <Button variant="secondary" size="md" onPress={() => {}}>
        {text}
      </Button>
    </>
  )
}
