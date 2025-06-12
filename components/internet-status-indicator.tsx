'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react'

interface InternetStatusIndicatorProps {
  showOnlyWhenOffline?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function InternetStatusIndicator({ 
  showOnlyWhenOffline = true, 
  size = 'sm',
  className = ''
}: InternetStatusIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Vérifier le statut initial
    setIsOnline(navigator.onLine)
    
    // Écouter les changements de connexion
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Ne pas rendre avant le montage pour éviter l'hydratation
  if (!mounted) {
    return null
  }

  // Si on doit seulement afficher quand hors ligne et qu'on est en ligne, ne rien afficher
  if (showOnlyWhenOffline && isOnline) {
    return null
  }

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm', 
    lg: 'text-base'
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={isOnline ? "default" : "destructive"}
            className={`${sizeClasses[size]} ${className} cursor-help`}
          >
            {isOnline ? (
              <Wifi className={`${iconSizes[size]} mr-1`} />
            ) : (
              <WifiOff className={`${iconSizes[size]} mr-1`} />
            )}
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            {isOnline ? (
              <>
                <p className="text-green-600 font-medium">🟢 Connexion Internet active</p>
                <p>Les conversions de devises sont disponibles en temps réel.</p>
              </>
            ) : (
              <>
                <p className="text-red-600 font-medium">🔴 Pas de connexion Internet</p>
                <p>Les conversions de devises ne sont pas disponibles.</p>
                <p className="text-muted-foreground">Reconnectez-vous pour voir les taux en temps réel.</p>
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Composant spécialisé pour les conversions de devises
export function CurrencyConversionStatus({ className = '' }: { className?: string }) {
  const [isOnline, setIsOnline] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setIsOnline(navigator.onLine)
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {!isOnline && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-amber-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs">Conversion indisponible</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs space-y-1 max-w-xs">
                <p className="font-medium">🌐 Connexion Internet requise</p>
                <p>Pour voir les conversions de devises en temps réel, veuillez vous connecter à Internet.</p>
                <p className="text-muted-foreground">Les montants s'affichent dans leur devise d'origine.</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}
