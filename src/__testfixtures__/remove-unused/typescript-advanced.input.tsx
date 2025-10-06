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
  const [_data, _setData] = useState<ResponseType<EncryptionDetailsResponseProps>>()
  const [_value, _setValue] = useState<SharedValue<number> | null>(null)

  const _screenName: Screens.PAYMENT_DETAILS | Screens.SAVINGS_TRANSACTION_DETAILS =
    Screens.PAYMENT_DETAILS

  type NavRef = typeof RootStack

  const _context = createContext<OnboardingFlowContextState | undefined>(undefined)

  type Variant = PreventSecondApplicationSheetProps['variant']

  return null
}
