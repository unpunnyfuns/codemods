import { createContext, useState } from 'react'
import {
  type EncryptionDetailsResponseProps,
  type OnboardingFlowContextState,
  type PreventSecondApplicationSheetProps,
  type RootStack,
  Screens,
  type SharedValue,
} from './app-types'
import type { ResponseType } from './types'

export function Component() {
  const [data, setData] = useState<ResponseType<EncryptionDetailsResponseProps>>()
  const [value, setValue] = useState<SharedValue<number> | null>(null)

  const screenName: Screens.PAYMENT_DETAILS | Screens.SAVINGS_TRANSACTION_DETAILS =
    Screens.PAYMENT_DETAILS

  type NavRef = typeof RootStack

  const context = createContext<OnboardingFlowContextState | undefined>(undefined)

  type Variant = PreventSecondApplicationSheetProps['variant']

  return null
}
