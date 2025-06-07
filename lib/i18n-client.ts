'use client'

import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import resourcesToBackend from 'i18next-resources-to-backend'
import LanguageDetector from 'i18next-browser-languagedetector'
import { isClient } from './safe-storage'

// Configuration i18n côté client
i18next
  .use(resourcesToBackend((language: string, namespace: string) => import(`../locales/${language}/${namespace}.json`)))
  .use(initReactI18next)
  .init({
    lng: 'en', // Forcer l'anglais
    fallbackLng: 'en',
    debug: false,
    
    ns: ['common', 'landing'],
    defaultNS: 'common',
    fallbackNS: 'common',
    
    interpolation: {
      escapeValue: false,
    },
    
    // Désactiver la détection automatique
    detection: {
      order: [],
      caches: []
    },
    
    // Forcer le chargement des ressources
    load: 'languageOnly',
    preload: ['en', 'fr'],
    
    // S'assurer que les ressources sont chargées de manière synchrone au début
    initImmediate: false,
    
    react: {
      useSuspense: false
    }
  })

export default i18next
