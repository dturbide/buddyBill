import { createInstance, i18n as I18NextInstance } from 'i18next'
import { initReactI18next } from 'react-i18next'
import resourcesToBackend from 'i18next-resources-to-backend'

const initI18next = async (lng: string, ns: string) => {
  const i18nInstance = createInstance()
  await i18nInstance
    .use(initReactI18next)  
    .use(
      resourcesToBackend(
        (language: string, namespace: string) =>
          import(`@/locales/${language}/${namespace}.json`)
      )
    )
    .init({
      lng,
      fallbackLng: 'en',
      supportedLngs: ['en', 'fr'],
      defaultNS: ns,
      fallbackNS: 'common',
      ns,
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    })
  
  return i18nInstance
}

export async function useTranslation(
  lng: string,
  ns: string = 'common',
  options: { keyPrefix?: string } = {}
) {
  const i18nextInstance = await initI18next(lng, ns)
  return {
    t: i18nextInstance.getFixedT(lng, Array.isArray(ns) ? ns[0] : ns, options.keyPrefix),
    i18n: i18nextInstance
  }
}

export const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' }
]

export const defaultLanguage = 'fr'

export const cookieName = 'i18next'
