'use client'

import { useTranslation } from 'react-i18next'
import HydrationSafe from './hydration-safe'

interface SafeTranslationProps {
  tKey: string
  ns?: string
  fallback: string
  values?: Record<string, any>
}

/**
 * Composant de traduction qui évite les erreurs d'hydratation
 * Affiche un texte de fallback côté serveur, puis la traduction côté client
 */
export default function SafeTranslation({ tKey, ns = 'common', fallback, values }: SafeTranslationProps) {
  const { t } = useTranslation(ns)

  return (
    <HydrationSafe fallback={fallback}>
      {t(tKey, values)}
    </HydrationSafe>
  )
}
