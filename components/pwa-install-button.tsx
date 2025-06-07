'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Smartphone, Download, ExternalLink } from 'lucide-react'
import SafeTranslation from './safe-translation'

interface PWAInstallButtonProps {
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  children?: React.ReactNode
  fallbackText?: string
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallButton({ 
  className = '', 
  variant = 'default', 
  size = 'default',
  children,
  fallbackText = 'Open App'
}: PWAInstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)

  useEffect(() => {
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
      // Déclencher l'installation PWA native
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
        // Fallback : ouvrir l'app dans un nouvel onglet
        window.open('https://buddy-bill.vercel.app', '_blank', 'noopener,noreferrer')
      }
    } else {
      // Si PWA non disponible, ouvrir dans un nouvel onglet
      window.open('https://buddy-bill.vercel.app', '_blank', 'noopener,noreferrer')
    }
  }

  return (
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
              <SafeTranslation 
                tKey="pwa.button" 
                ns="landing" 
                fallback="Install App"
              />
            </>
          ) : (
            <>
              <ExternalLink className="h-4 w-4 mr-2" />
              <SafeTranslation 
                tKey="pwa.button" 
                ns="landing" 
                fallback={fallbackText}
              />
            </>
          )}
        </>
      )}
    </Button>
  )
}
