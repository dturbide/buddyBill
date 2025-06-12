'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Database, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  Download,
  Upload
} from 'lucide-react'
import { useOnlineStatus } from '@/lib/offline-storage'

interface OfflineIndicatorProps {
  showDetails?: boolean
  variant?: 'compact' | 'detailed' | 'card'
}

export function OfflineIndicator({ showDetails = false, variant = 'compact' }: OfflineIndicatorProps) {
  const isOnline = useOnlineStatus()
  
  // Mock des données de sync pour éviter les erreurs d'import
  const syncStatus = {
    isLoading: false,
    lastSync: new Date(),
    pendingActions: 0,
    error: null,
    cacheSizes: { groups: 0, expenses: 0, users: 0, actions: 0 }
  }

  const forceSync = () => {
    console.log('Force sync clicked')
  }

  // Version compacte pour la barre de navigation
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <Badge 
          variant={isOnline ? 'default' : 'destructive'} 
          className="flex items-center gap-1"
        >
          {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {isOnline ? 'En ligne' : 'Hors ligne'}
        </Badge>
        
        {syncStatus.pendingActions > 0 && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {syncStatus.pendingActions}
          </Badge>
        )}
        
        {syncStatus.isLoading && (
          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
    )
  }

  // Version détaillée pour les paramètres
  if (variant === 'detailed') {
    return (
      <div className="space-y-4">
        {/* État de connexion */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            <span className="font-medium">
              {isOnline ? 'Connecté' : 'Déconnecté'}
            </span>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={forceSync}
            disabled={!isOnline || syncStatus.isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncStatus.isLoading ? 'animate-spin' : ''}`} />
            Synchroniser
          </Button>
        </div>

        {/* Statistiques du cache */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-blue-500" />
            <div className="text-sm">
              <div className="font-medium">{syncStatus.cacheSizes.groups} groupes</div>
              <div className="text-muted-foreground">en cache</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-green-500" />
            <div className="text-sm">
              <div className="font-medium">{syncStatus.cacheSizes.expenses} dépenses</div>
              <div className="text-muted-foreground">disponibles offline</div>
            </div>
          </div>
        </div>

        {/* Actions en attente */}
        {syncStatus.pendingActions > 0 && (
          <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <Upload className="h-4 w-4 text-orange-500" />
            <div className="text-sm">
              <div className="font-medium text-orange-700">
                {syncStatus.pendingActions} actions en attente
              </div>
              <div className="text-orange-600">
                Sera synchronisé une fois en ligne
              </div>
            </div>
          </div>
        )}

        {/* Dernière synchronisation */}
        {syncStatus.lastSync && (
          <div className="text-xs text-muted-foreground">
            Dernière sync: {syncStatus.lastSync.toLocaleString()}
          </div>
        )}

        {/* Erreur */}
        {syncStatus.error && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <div className="text-sm text-red-700 font-medium">
                Erreur de synchronisation
              </div>
            </div>
            <div className="text-xs text-red-600 mt-1">
              {syncStatus.error}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Version carte pour le dashboard
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Database className="h-4 w-4" />
          État hors-ligne
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Indicateur de connexion */}
          <div className="flex items-center justify-between">
            <Badge variant={isOnline ? 'default' : 'destructive'}>
              {isOnline ? (
                <>
                  <Wifi className="h-3 w-3 mr-1" />
                  En ligne
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 mr-1" />
                  Hors ligne
                </>
              )}
            </Badge>
            
            {syncStatus.isLoading && (
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Progrès de synchronisation */}
          {syncStatus.isLoading && (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">
                Synchronisation...
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div className="bg-blue-600 h-1 rounded-full animate-pulse w-3/4"></div>
              </div>
            </div>
          )}

          {/* Résumé des données */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="font-semibold text-blue-700">
                {syncStatus.cacheSizes.groups}
              </div>
              <div className="text-blue-600">groupes</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="font-semibold text-green-700">
                {syncStatus.cacheSizes.expenses}
              </div>
              <div className="text-green-600">dépenses</div>
            </div>
          </div>

          {/* Actions en attente */}
          {syncStatus.pendingActions > 0 && (
            <div className="text-center p-2 bg-orange-50 rounded border border-orange-200">
              <div className="font-semibold text-orange-700">
                {syncStatus.pendingActions}
              </div>
              <div className="text-orange-600 text-xs">en attente</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
