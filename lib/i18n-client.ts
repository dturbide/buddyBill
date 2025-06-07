'use client'

import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import resourcesToBackend from 'i18next-resources-to-backend'
import LanguageDetector from 'i18next-browser-languagedetector'
import { isClient } from './safe-storage'

// Configuration i18n côté client
let i18nInstance = i18next.use(initReactI18next);

// N'utilise le détecteur de langue que côté client
if (isClient) {
  i18nInstance = i18nInstance.use(LanguageDetector);
}

// Utilisation du backend pour charger les fichiers de traduction
i18nInstance = i18nInstance.use(
  resourcesToBackend(
    (language: string, namespace: string) =>
      import(`@/locales/${language}/${namespace}.json`)
  )
);

// Configuration initiale sans dépendance au navigateur
i18nInstance.init({
    lng: 'fr', // Langue par défaut
    fallbackLng: 'fr',
    supportedLngs: ['fr', 'en'],
    defaultNS: 'common',
    fallbackNS: 'common',
    ns: ['common', 'dashboard', 'expenses', 'groups', 'landing'],
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    // Configuration de détection uniquement côté client
    detection: isClient ? {
      order: ['cookie', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['cookie', 'localStorage'],
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
    } : undefined,
  })

export default i18nInstance
