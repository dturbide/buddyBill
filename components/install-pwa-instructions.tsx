"use client"

import { useState, useEffect } from 'react'
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

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const instructions = {
  fr: {
    title: "📱 Installer BuddyBill sur votre téléphone",
    subtitle: "Accès rapide depuis votre écran d'accueil",
    installButton: "Installer l'App",
    closeButton: "Plus tard",
    benefits: {
      title: "Pourquoi installer l'app ?",
      items: [
        "🚀 Accès instantané depuis votre écran d'accueil",
        "⚡ Performance optimisée et navigation plus fluide",
        "🔔 Notifications pour les nouveaux paiements",
        "📱 Fonctionne même en mode hors ligne",
        "💾 Synchronisation automatique de vos données"
      ]
    },
    instructions: {
      android: {
        title: "Sur Android (Chrome/Edge)",
        steps: [
          "1. Appuyez sur le bouton 'Installer l'App' ci-dessus",
          "2. Ou appuyez sur les 3 points ⋮ dans votre navigateur",
          "3. Sélectionnez 'Installer l'application' ou 'Ajouter à l'écran d'accueil'",
          "4. Confirmez l'installation en appuyant sur 'Installer'"
        ]
      },
      ios: {
        title: "Sur iPhone/iPad (Safari)",
        steps: [
          "1. Appuyez sur le bouton Partager 📤 en bas de Safari",
          "2. Faites défiler et sélectionnez 'Sur l'écran d'accueil'",
          "3. Modifiez le nom si souhaité (BuddyBill)",
          "4. Appuyez sur 'Ajouter' en haut à droite"
        ]
      },
      desktop: {
        title: "Sur Ordinateur (Chrome/Edge)",
        steps: [
          "1. Cliquez sur l'icône d'installation dans la barre d'adresse",
          "2. Ou allez dans Menu → 'Installer BuddyBill...'",
          "3. Cliquez sur 'Installer' dans la pop-up",
          "4. L'app s'ouvrira dans une fenêtre dédiée"
        ]
      }
    }
  },
  en: {
    title: "📱 Install BuddyBill on your phone",
    subtitle: "Quick access from your home screen",
    installButton: "Install App",
    closeButton: "Maybe Later",
    benefits: {
      title: "Why install the app?",
      items: [
        "🚀 Instant access from your home screen",
        "⚡ Optimized performance and smoother navigation",
        "🔔 Notifications for new payments",
        "📱 Works even in offline mode",
        "💾 Automatic data synchronization"
      ]
    },
    instructions: {
      android: {
        title: "On Android (Chrome/Edge)",
        steps: [
          "1. Tap the 'Install App' button above",
          "2. Or tap the 3 dots ⋮ in your browser",
          "3. Select 'Install app' or 'Add to Home screen'",
          "4. Confirm installation by tapping 'Install'"
        ]
      },
      ios: {
        title: "On iPhone/iPad (Safari)",
        steps: [
          "1. Tap the Share button 📤 at the bottom of Safari",
          "2. Scroll down and select 'Add to Home Screen'",
          "3. Edit the name if desired (BuddyBill)",
          "4. Tap 'Add' in the top right"
        ]
      },
      desktop: {
        title: "On Desktop (Chrome/Edge)",
        steps: [
          "1. Click the install icon in the address bar",
          "2. Or go to Menu → 'Install BuddyBill...'",
          "3. Click 'Install' in the popup",
          "4. The app will open in a dedicated window"
        ]
      }
    }
  }
}

interface InstallPWAInstructionsProps {
  language?: 'fr' | 'en'
}

export default function InstallPWAInstructions({ language = 'fr' }: InstallPWAInstructionsProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [deviceType, setDeviceType] = useState<'android' | 'ios' | 'desktop'>('desktop')

  const t = instructions[language]

  useEffect(() => {
    // Détecter le type d'appareil
    const userAgent = navigator.userAgent.toLowerCase()
    if (/android/.test(userAgent)) {
      setDeviceType('android')
    } else if (/iphone|ipad/.test(userAgent)) {
      setDeviceType('ios')
    } else {
      setDeviceType('desktop')
    }

    // Vérifier si l'app est déjà installée
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsVisible(true)
    }

    // Afficher les instructions après 3 secondes si pas d'événement PWA
    const timer = setTimeout(() => {
      if (!isInstalled) {
        setIsVisible(true)
      }
    }, 3000)

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      clearTimeout(timer)
    }
  }, [isInstalled])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        setIsInstalled(true)
        setIsVisible(false)
      }
      
      setDeferredPrompt(null)
    }
  }

  const handleClose = () => {
    setIsVisible(false)
    // Re-afficher dans 24h
    localStorage.setItem('buddybill-install-dismissed', Date.now().toString())
  }

  // Ne pas afficher si déjà installé ou si récemment fermé
  const lastDismissed = localStorage.getItem('buddybill-install-dismissed')
  if (isInstalled || !isVisible || (lastDismissed && Date.now() - parseInt(lastDismissed) < 24 * 60 * 60 * 1000)) {
    return null
  }

  const currentInstructions = t.instructions[deviceType]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{t.title}</CardTitle>
              <CardDescription>{t.subtitle}</CardDescription>
            </div>
          </div>

          {deferredPrompt && (
            <Button 
              onClick={handleInstallClick}
              className="w-full mt-4"
              size="lg"
            >
              <Download className="h-5 w-5 mr-2" />
              {t.installButton}
            </Button>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Avantages */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              {t.benefits.title}
            </h3>
            <ul className="space-y-2">
              {t.benefits.items.map((benefit, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions spécifiques à l'appareil */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              {deviceType === 'android' && <Chrome className="h-5 w-5 text-blue-500" />}
              {deviceType === 'ios' && <Smartphone className="h-5 w-5 text-blue-500" />}
              {deviceType === 'desktop' && <Monitor className="h-5 w-5 text-blue-500" />}
              <h3 className="font-semibold">{currentInstructions.title}</h3>
              <Badge variant="secondary" className="text-xs">
                {deviceType === 'android' && 'Android'}
                {deviceType === 'ios' && 'iOS'}
                {deviceType === 'desktop' && 'Desktop'}
              </Badge>
            </div>

            <ol className="space-y-2">
              {currentInstructions.steps.map((step, index) => (
                <li key={index} className="text-sm text-muted-foreground leading-relaxed">
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Bouton fermer */}
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              {t.closeButton}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
