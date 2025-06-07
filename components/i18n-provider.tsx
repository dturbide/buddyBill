'use client'

import { useEffect } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18next from '@/lib/i18n-client'

interface I18nProviderProps {
  children: React.ReactNode
  locale?: string
}

export default function I18nProvider({ children, locale = 'en' }: I18nProviderProps) {
  useEffect(() => {
    // Initialiser la langue si fournie, de manière simple
    if (locale && i18next.language !== locale) {
      i18next.changeLanguage(locale)
    }

    // Écouter les changements de langue et mettre à jour le document
    const handleLanguageChange = (lng: string) => {
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lng
      }
    }

    i18next.on('languageChanged', handleLanguageChange)

    return () => {
      i18next.off('languageChanged', handleLanguageChange)
    }
  }, [locale])

  return (
    <I18nextProvider i18n={i18next}>
      {children}
    </I18nextProvider>
  )
}
