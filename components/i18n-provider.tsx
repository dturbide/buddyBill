'use client'

import { useEffect } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18next from '@/lib/i18n-client'

interface I18nProviderProps {
  children: React.ReactNode
  locale?: string
}

export default function I18nProvider({ children, locale = 'fr' }: I18nProviderProps) {
  useEffect(() => {
    // Initialiser la langue si fournie
    if (locale && i18next.language !== locale) {
      i18next.changeLanguage(locale)
    }
  }, [locale])

  return (
    <I18nextProvider i18n={i18next}>
      {children}
    </I18nextProvider>
  )
}
