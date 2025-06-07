'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Fingerprint, 
  Shield, 
  ShieldCheck, 
  Smartphone, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  Trash2
} from 'lucide-react'
import { useBiometricAuth } from '@/hooks/use-biometric-auth'

interface BiometricAuthProps {
  mode?: 'setup' | 'authenticate' | 'manage'
  onSuccess?: () => void
  onError?: (error: string) => void
  className?: string
}

export function BiometricAuth({ 
  mode = 'setup', 
  onSuccess, 
  onError,
  className = '' 
}: BiometricAuthProps) {
  const {
    isSupported,
    isLoading,
    hasCredentials,
    biometricType,
    error,
    register,
    authenticate,
    clearError
  } = useBiometricAuth()

  const [showDetails, setShowDetails] = useState(false)

  // Gérer l'enregistrement
  const handleRegister = async () => {
    clearError()
    const success = await register()
    
    if (success) {
      onSuccess?.()
    } else if (error) {
      onError?.(error)
    }
  }

  // Gérer l'authentification
  const handleAuthenticate = async () => {
    clearError()
    const success = await authenticate()
    
    if (success) {
      onSuccess?.()
    } else if (error) {
      onError?.(error)
    }
  }

  // Icône selon le type de biométrie
  const getBiometricIcon = () => {
    if (biometricType.includes('Face ID')) {
      return <Smartphone className="h-8 w-8" />
    }
    return <Fingerprint className="h-8 w-8" />
  }

  // Si pas supporté
  if (!isSupported) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Authentification Biométrique
          </CardTitle>
          <CardDescription>
            Non disponible sur cet appareil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Votre appareil ne supporte pas l'authentification biométrique ou votre navigateur n'est pas compatible.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Mode configuration/enregistrement
  if (mode === 'setup') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Sécuriser avec la Biométrie
          </CardTitle>
          <CardDescription>
            Utilisez {biometricType.toLowerCase()} pour vous connecter rapidement et en sécurité
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Statut actuel */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {getBiometricIcon()}
              <div>
                <p className="font-medium">{biometricType}</p>
                <p className="text-sm text-gray-600">
                  {hasCredentials ? 'Configuré' : 'Non configuré'}
                </p>
              </div>
            </div>
            <Badge variant={hasCredentials ? 'default' : 'secondary'}>
              {hasCredentials ? (
                <CheckCircle className="h-4 w-4 mr-1" />
              ) : (
                <Shield className="h-4 w-4 mr-1" />
              )}
              {hasCredentials ? 'Actif' : 'Inactif'}
            </Badge>
          </div>

          {/* Message d'erreur */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Avantages */}
          {!hasCredentials && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Avantages :</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Connexion rapide et sécurisée
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Aucun mot de passe à retenir
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Protection avancée contre le phishing
                </li>
              </ul>
            </div>
          )}

          {/* Bouton d'action */}
          <Button
            onClick={handleRegister}
            disabled={isLoading || hasCredentials}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Configuration...
              </>
            ) : hasCredentials ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Déjà configuré
              </>
            ) : (
              <>
                <Fingerprint className="h-4 w-4 mr-2" />
                Configurer {biometricType}
              </>
            )}
          </Button>

          {/* Lien pour plus de détails */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {showDetails ? 'Masquer' : 'En savoir plus'}
          </button>

          {showDetails && (
            <div className="text-sm text-gray-600 p-4 bg-blue-50 rounded-lg">
              <p className="font-medium mb-2">Comment ça fonctionne :</p>
              <p>
                L'authentification biométrique utilise votre {biometricType.toLowerCase()} 
                pour créer une clé de sécurité unique stockée localement sur votre appareil. 
                Cette clé ne peut pas être copiée ou volée et reste toujours sur votre appareil.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Mode authentification
  if (mode === 'authenticate') {
    return (
      <Card className={className}>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {getBiometricIcon()}
            Authentification Biométrique
          </CardTitle>
          <CardDescription>
            Utilisez votre {biometricType.toLowerCase()} pour vous connecter
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Message d'erreur */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Bouton d'authentification */}
          <Button
            onClick={handleAuthenticate}
            disabled={isLoading || !hasCredentials}
            className="w-full"
            size="lg"
            variant="outline"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Authentification...
              </>
            ) : (
              <>
                {getBiometricIcon()}
                <span className="ml-2">Se connecter avec {biometricType}</span>
              </>
            )}
          </Button>

          {!hasCredentials && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Vous devez d'abord configurer l'authentification biométrique dans vos paramètres.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    )
  }

  // Mode par défaut
  return null
}

export default BiometricAuth
