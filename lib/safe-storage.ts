'use client'

/**
 * Utilitaire pour accéder à localStorage de façon sécurisée
 * Compatible avec SSR/SSG et environnements sans window
 */

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key)
    }
    return null
  },
  
  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value)
    }
  },
  
  removeItem: (key: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key)
    }
  }
}

/**
 * Helper qui vérifie si le code s'exécute côté client
 */
export const isClient = typeof window !== 'undefined'
