"use client"

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Smartphone, 
  Download, 
  Share, 
  Plus, 
  Chrome,
  Monitor,
  X,
  CheckCircle
} from 'lucide-react'
import { safeLocalStorage } from '@/lib/safe-storage'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPWAInstructions() {
  const { t } = useTranslation(['landing', 'common'])
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstructions, setShowInstructions] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [deviceType, setDeviceType] = useState<'android' | 'ios' | 'desktop'>('desktop')

  useEffect(() => {
    // Vérifier si l'app est déjà installée
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Détecter le type d'appareil
    const userAgent = navigator.userAgent.toLowerCase()
    if (/android/.test(userAgent)) {
      setDeviceType('android')
    } else if (/iphone|ipad|ipod/.test(userAgent)) {
      setDeviceType('ios')
    } else {
      setDeviceType('desktop')
    }

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Ne plus afficher automatiquement les instructions
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Ne plus afficher automatiquement les instructions lors de la première visite
    // L'utilisateur doit cliquer sur le bouton pour voir les instructions

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [deviceType])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowInstructions(false)
        setIsInstalled(true)
        // Rediriger vers l'app déployée après installation
        setTimeout(() => {
          window.open('https://buddy-bill.vercel.app/welcome', '_blank')
        }, 1000)
      }
      setDeferredPrompt(null)
    } else {
      // Pour les navigateurs qui ne supportent pas l'installation automatique
      // Ouvrir directement l'app déployée
      window.open('https://buddy-bill.vercel.app/welcome', '_blank')
      setShowInstructions(true)
    }
  }

  const handleDismiss = () => {
    setShowInstructions(false)
    safeLocalStorage?.setItem('pwa-instructions-seen', 'true')
  }

  if (isInstalled) {
    return (
      <div className="text-center p-6">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {t("pwa.title", {ns: 'landing'})}
        </h3>
        <p className="text-gray-600">
          App successfully installed!
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12 reveal">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {t("pwa.title", {ns: 'landing'})}
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          {t("pwa.subtitle", {ns: 'landing'})}
        </p>
        
        <Button 
          onClick={handleInstallClick}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
        >
          <Download className="h-5 w-5 mr-2" />
          {t("pwa.button", {ns: 'landing'})}
        </Button>
      </div>

      {showInstructions && (
        <Card className="mb-8 border-blue-200 shadow-lg reveal">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl text-blue-900">
                  {t("pwa.whyInstall.title", {ns: 'landing'})}
                </CardTitle>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleDismiss}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Avantages */}
              <div>
                <ul className="space-y-3">
                  {(t("pwa.whyInstall.benefits", {ns: 'landing', returnObjects: true}) as string[]).map((benefit: string, index: number) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Instructions selon l'appareil */}
              <div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    {deviceType === 'desktop' ? (
                      <>
                        <Monitor className="h-5 w-5" />
                        {t("pwa.desktop.title", {ns: 'landing'})}
                      </>
                    ) : deviceType === 'android' ? (
                      <>
                        <Smartphone className="h-5 w-5" />
                        {t("pwa.mobile.title", {ns: 'landing'})}
                      </>
                    ) : (
                      <>
                        <Smartphone className="h-5 w-5" />
                        {t("pwa.mobile.title", {ns: 'landing'})}
                      </>
                    )}
                  </h4>
                  <ol className="space-y-2 text-sm text-gray-600">
                    {(t(`pwa.${deviceType === 'desktop' ? 'desktop' : 'mobile'}.steps`, {ns: 'landing', returnObjects: true}) as string[]).map((step: string, index: number) => (
                      <li key={index} className="flex gap-2">
                        <span className="font-medium">{index + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
