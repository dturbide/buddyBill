'use client'

import { useState, useEffect, useCallback } from 'react'
import { biometricAuth } from '@/lib/biometric-auth'
import { createClient } from '@/lib/supabase/client'

interface UseBiometricAuthReturn {
  // États
  isSupported: boolean
  isLoading: boolean
  hasCredentials: boolean
  biometricType: string
  error: string | null
  
  // Actions
  register: () => Promise<boolean>
  authenticate: () => Promise<boolean>
  removeCredential: (credentialId: string) => Promise<boolean>
  checkCredentials: () => Promise<void>
  clearError: () => void
}

export function useBiometricAuth(): UseBiometricAuthReturn {
  // États
  const [isSupported, setIsSupported] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasCredentials, setHasCredentials] = useState(false)
  const [biometricType, setBiometricType] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Initialisation
  useEffect(() => {
    const checkSupport = () => {
      const supported = biometricAuth.isSupported()
      setIsSupported(supported)
      
      if (supported) {
        setBiometricType(biometricAuth.getAvailableBiometricType())
      }
    }

    checkSupport()
    checkCredentials()
  }, [])

  // Vérifier si l'utilisateur a des credentials
  const checkCredentials = useCallback(async () => {
    try {
      const supabaseClient = createClient()
      const user = await supabaseClient.auth.getUser()
      if (!user) {
        setHasCredentials(false)
        return
      }

      const hasExistingCredentials = await biometricAuth.hasCredentials(user.data.user.id)
      setHasCredentials(hasExistingCredentials)
    } catch (error) {
      console.error('Erreur vérification credentials:', error)
      setHasCredentials(false)
    }
  }, [])

  // Enregistrer un nouveau credential biométrique
  const register = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Authentification biométrique non supportée sur cet appareil')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabaseClient = createClient()
      const user = await supabaseClient.auth.getUser()
      if (!user) {
        throw new Error('Utilisateur non connecté')
      }

      const success = await biometricAuth.registerBiometric(user.data.user.id, biometricType)
      
      if (success) {
        setHasCredentials(true)
        return true
      }
      
      return false
    } catch (error: any) {
      console.error('Erreur enregistrement biométrie:', error)
      
      // Messages d'erreur adaptés
      if (error.name === 'InvalidStateError') {
        setError('Un credential biométrique existe déjà pour cet appareil')
      } else if (error.name === 'NotAllowedError') {
        setError('Authentification biométrique refusée par l\'utilisateur')
      } else if (error.name === 'AbortError') {
        setError('Enregistrement annulé')
      } else {
        setError(error.message || 'Impossible d\'enregistrer l\'authentification biométrique')
      }
      
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, biometricType])

  // Authentifier avec biométrie
  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Authentification biométrique non supportée sur cet appareil')
      return false
    }

    if (!hasCredentials) {
      setError('Aucun credential biométrique enregistré')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabaseClient = createClient()
      const user = await supabaseClient.auth.getUser()
      const success = await biometricAuth.authenticateWithBiometric(user?.data.user.id)
      return success
    } catch (error: any) {
      console.error('Erreur authentification biométrie:', error)
      
      // Messages d'erreur adaptés
      if (error.name === 'NotAllowedError') {
        setError('Authentification biométrique refusée')
      } else if (error.name === 'AbortError') {
        setError('Authentification annulée')
      } else if (error.name === 'InvalidStateError') {
        setError('Credential biométrique invalide')
      } else {
        setError(error.message || 'Échec de l\'authentification biométrique')
      }
      
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, hasCredentials])

  // Supprimer un credential
  const removeCredential = useCallback(async (credentialId: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const success = await biometricAuth.removeCredential(credentialId)
      
      if (success) {
        await checkCredentials() // Refresh credentials
      }
      
      return success
    } catch (error: any) {
      console.error('Erreur suppression credential:', error)
      setError(error.message || 'Impossible de supprimer le credential')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [checkCredentials])

  // Effacer les erreurs
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    // États
    isSupported,
    isLoading,
    hasCredentials,
    biometricType,
    error,
    
    // Actions
    register,
    authenticate,
    removeCredential,
    checkCredentials,
    clearError,
  }
}

export default useBiometricAuth
