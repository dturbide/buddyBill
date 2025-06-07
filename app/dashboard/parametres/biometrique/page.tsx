'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield } from 'lucide-react'
import { BiometricAuth } from '@/components/biometric-auth'
import { AppLayout } from '@/components/app-layout'

export default function BiometricSettingsPage() {
  const handleSuccess = () => {
    // Montrer un message de succès ou rediriger
    console.log('Configuration biométrique réussie !')
  }

  const handleError = (error: string) => {
    // Gérer les erreurs
    console.error('Erreur configuration biométrique:', error)
  }

  return (
    <AppLayout 
      title="Authentification Biométrique"
      showBackButton={true}
      backHref="/dashboard/parametres"
      showNavigation={true}
    >
      {/* Titre de section */}
      <div className="text-center space-y-2 mb-6">
        <div className="flex justify-center mb-3">
          <Shield className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          Sécurité Renforcée
        </h2>
        <p className="text-gray-600">
          Protégez votre compte BuddyBill avec votre biométrie
        </p>
      </div>

      {/* Composant principal */}
      <BiometricAuth
        mode="setup"
        onSuccess={handleSuccess}
        onError={handleError}
        className="mb-6"
      />

      {/* Informations supplémentaires */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sécurité & Confidentialité</CardTitle>
          <CardDescription>
            Votre sécurité est notre priorité
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-sm">Données locales</p>
                <p className="text-sm text-gray-600">
                  Vos données biométriques restent toujours sur votre appareil
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-sm">Chiffrement avancé</p>
                <p className="text-sm text-gray-600">
                  Utilise les standards WebAuthn et FIDO2
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-sm">Pas de mots de passe</p>
                <p className="text-sm text-gray-600">
                  Plus besoin de retenir ou taper votre mot de passe
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Note technique */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-800">
            <strong>Note :</strong> L'authentification biométrique nécessite un appareil 
            compatible (iPhone avec Face ID/Touch ID, Android avec empreinte digitale, 
            ou ordinateur avec Windows Hello/Touch ID).
          </p>
        </CardContent>
      </Card>
    </AppLayout>
  )
}
