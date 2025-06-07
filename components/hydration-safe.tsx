'use client'

import { useEffect, useState } from 'react'

interface HydrationSafeProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Composant qui évite les erreurs d'hydratation en attendant que le client soit monté
 * Affiche un fallback côté serveur, puis le contenu réel côté client
 */
export default function HydrationSafe({ children, fallback = null }: HydrationSafeProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Côté serveur ou avant hydratation : afficher le fallback
  if (!mounted) {
    return <>{fallback}</>
  }

  // Côté client après hydratation : afficher le contenu réel
  return <>{children}</>
}
