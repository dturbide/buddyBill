'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Smartphone, Download, ExternalLink, Info, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'

interface PWAInstallButtonProps {
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  children?: React.ReactNode
  fallbackText?: string
  showInstructions?: boolean
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Détection du type d'appareil et navigateur
const detectDevice = () => {
  if (typeof window === 'undefined') return { device: 'unknown', browser: 'unknown' }
  
  const userAgent = window.navigator.userAgent.toLowerCase()
  const isIOS = /iphone|ipad|ipod/.test(userAgent)
  const isAndroid = /android/.test(userAgent)
  const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent)
  const isChrome = /chrome/.test(userAgent)
  const isFirefox = /firefox/.test(userAgent)
  
  let device = 'desktop'
  if (isIOS) device = 'ios'
  else if (isAndroid) device = 'android'
  
  let browser = 'other'
  if (isSafari) browser = 'safari'
  else if (isChrome) browser = 'chrome'
  else if (isFirefox) browser = 'firefox'
  
  return { device, browser }
}

export default function PWAInstallButton({ 
  className = '', 
  variant = 'default', 
  size = 'default',
  children,
  fallbackText = 'Open App',
  showInstructions = true
}: PWAInstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [deviceInfo, setDeviceInfo] = useState({ device: 'unknown', browser: 'unknown' })

  useEffect(() => {
    setDeviceInfo(detectDevice())
    
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleClick = async () => {
    if (deferredPrompt && isInstallable) {
      // Installation PWA native (principalement Chrome desktop)
      try {
        await deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        
        if (outcome === 'accepted') {
          console.log('PWA installée avec succès')
        } else {
          console.log('Installation PWA annulée')
        }
        
        setDeferredPrompt(null)
        setIsInstallable(false)
      } catch (error) {
        console.error('Erreur lors de l\'installation PWA:', error)
        if (showInstructions) {
          setShowDialog(true)
        } else {
          window.open('https://buddy-bill.vercel.app', '_blank', 'noopener,noreferrer')
        }
      }
    } else {
      // Pas d'installation native disponible
      if (showInstructions && (deviceInfo.device === 'ios' || deviceInfo.device === 'android')) {
        setShowDialog(true)
      } else {
        window.open('https://buddy-bill.vercel.app', '_blank', 'noopener,noreferrer')
      }
    }
  }

  const getInstallInstructions = () => {
    const { device, browser } = deviceInfo
    
    if (device === 'ios' && browser === 'safari') {
      return {
        title: '📱 Installer BuddyBill sur iOS',
        steps: [
          '1. Ouvrez buddy-bill.vercel.app dans Safari',
          '2. Appuyez sur le bouton Partager ⬆️ en bas',
          '3. Sélectionnez "Sur l\'écran d\'accueil"',
          '4. Appuyez sur "Ajouter" en haut à droite'
        ]
      }
    } else if (device === 'android' && browser === 'chrome') {
      return {
        title: '📱 Installer BuddyBill sur Android',
        steps: [
          '1. Ouvrez buddy-bill.vercel.app dans Chrome',
          '2. Appuyez sur les 3 points ⋮ en haut à droite',
          '3. Sélectionnez "Ajouter à l\'écran d\'accueil"',
          '4. Appuyez sur "Ajouter" pour confirmer'
        ]
      }
    } else {
      return {
        title: '💻 Installer BuddyBill',
        steps: [
          '1. Ouvrez buddy-bill.vercel.app dans votre navigateur',
          '2. Recherchez l\'icône d\'installation dans la barre d\'adresse',
          '3. Cliquez sur "Installer" si disponible',
          '4. Ou utilisez le menu de votre navigateur'
        ]
      }
    }
  }

  const instructions = getInstallInstructions()

  return (
    <>
      <Button 
        onClick={handleClick}
        variant={variant}
        size={size}
        className={className}
      >
        {children || (
          <>
            {isInstallable ? (
              <>
                <Download className="h-4 w-4 mr-2" />
                Installer l'app
              </>
            ) : (
              <>
                <Smartphone className="h-4 w-4 mr-2" />
                {deviceInfo.device === 'ios' || deviceInfo.device === 'android' ? 'Installer l\'app' : fallbackText}
              </>
            )}
          </>
        )}
      </Button>

      {/* Dialog d'instructions d'installation */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-green-600" />
              {instructions.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 mb-3 font-medium">
                Suivez ces étapes pour installer BuddyBill :
              </p>
              <ol className="space-y-2">
                {instructions.steps.map((step, index) => (
                  <li key={index} className="text-sm text-blue-700 flex items-start gap-2">
                    <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    {step.replace(/^\d+\.\s*/, '')}
                  </li>
                ))}
              </ol>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  setShowDialog(false)
                  window.open('https://buddy-bill.vercel.app', '_blank', 'noopener,noreferrer')
                }}
                className="flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ouvrir l'app
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowDialog(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
