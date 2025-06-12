'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { offlineStorage } from '@/lib/offline-storage'
import { toast } from 'sonner'

export interface DataConflict {
  id: string
  type: 'expense' | 'group'
  local_data: any
  server_data: any
  field_conflicts: string[]
  created_at: number
  resolved?: boolean
}

export interface ConflictResolution {
  conflict_id: string
  resolution_type: 'use_local' | 'use_server' | 'merge' | 'manual'
  merged_data?: any
}

export function useConflictResolution() {
  const [conflicts, setConflicts] = useState<DataConflict[]>([])
  const [isResolving, setIsResolving] = useState(false)
  const supabase = createClient()

  // === DÉTECTION DES CONFLITS ===
  const detectConflicts = useCallback(async () => {
    try {
      // Récupérer les données locales en attente
      const pendingActions = await offlineStorage.getPendingActions()
      const detectedConflicts: DataConflict[] = []

      for (const action of pendingActions) {
        if (action.type === 'UPDATE_EXPENSE' || action.type === 'CREATE_EXPENSE') {
          // Vérifier si l'élément existe côté serveur avec des données différentes
          const { data: serverData, error } = await supabase
            .from('expenses')
            .select('*')
            .eq('id', action.data.id)
            .single()

          if (!error && serverData) {
            // Comparer les données locales et serveur
            const fieldConflicts = detectFieldConflicts(action.data, serverData)
            
            if (fieldConflicts.length > 0) {
              detectedConflicts.push({
                id: `conflict_${action.id}`,
                type: 'expense',
                local_data: action.data,
                server_data: serverData,
                field_conflicts: fieldConflicts,
                created_at: Date.now()
              })
            }
          }
        }
      }

      setConflicts(detectedConflicts)
      return detectedConflicts
    } catch (error) {
      console.error('Erreur lors de la détection des conflits:', error)
      return []
    }
  }, [supabase])

  // === DÉTECTION DES DIFFÉRENCES ENTRE CHAMPS ===
  const detectFieldConflicts = useCallback((localData: any, serverData: any): string[] => {
    const conflicts: string[] = []
    const fieldsToCheck = ['description', 'amount', 'currency', 'expense_date', 'notes']

    for (const field of fieldsToCheck) {
      if (localData[field] !== serverData[field]) {
        conflicts.push(field)
      }
    }

    return conflicts
  }, [])

  // === RÉSOLUTION AUTOMATIQUE INTELLIGENTE ===
  const autoResolveConflict = useCallback((conflict: DataConflict): ConflictResolution | null => {
    // Règles de résolution automatique
    
    // 1. Si modification récente (< 5 minutes), privilégier local
    if (Date.now() - conflict.created_at < 5 * 60 * 1000) {
      return {
        conflict_id: conflict.id,
        resolution_type: 'use_local'
      }
    }

    // 2. Si seuls les montants diffèrent et local est plus récent, privilégier local
    if (conflict.field_conflicts.length === 1 && conflict.field_conflicts[0] === 'amount') {
      return {
        conflict_id: conflict.id,
        resolution_type: 'use_local'
      }
    }

    // 3. Si conflit sur description uniquement, merger les deux
    if (conflict.field_conflicts.length === 1 && conflict.field_conflicts[0] === 'description') {
      return {
        conflict_id: conflict.id,
        resolution_type: 'merge',
        merged_data: {
          ...conflict.server_data,
          description: `${conflict.local_data.description} | ${conflict.server_data.description}`
        }
      }
    }

    // 4. Sinon, nécessite résolution manuelle
    return null
  }, [])

  // === RÉSOLUTION D'UN CONFLIT ===
  const resolveConflict = useCallback(async (resolution: ConflictResolution) => {
    setIsResolving(true)

    try {
      const conflict = conflicts.find(c => c.id === resolution.conflict_id)
      if (!conflict) throw new Error('Conflit introuvable')

      let finalData: any

      switch (resolution.resolution_type) {
        case 'use_local':
          finalData = conflict.local_data
          break
        case 'use_server':
          finalData = conflict.server_data
          break
        case 'merge':
          finalData = resolution.merged_data || { ...conflict.server_data, ...conflict.local_data }
          break
        case 'manual':
          finalData = resolution.merged_data
          break
      }

      // Appliquer la résolution côté serveur
      if (conflict.type === 'expense') {
        const { error } = await supabase
          .from('expenses')
          .update(finalData)
          .eq('id', conflict.local_data.id)

        if (error) throw error
      }

      // Marquer le conflit comme résolu
      setConflicts(prev => prev.filter(c => c.id !== resolution.conflict_id))

      // Supprimer l'action en attente
      const pendingActions = await offlineStorage.getPendingActions()
      const relatedAction = pendingActions.find(a => a.data.id === conflict.local_data.id)
      if (relatedAction) {
        await offlineStorage.removePendingAction(relatedAction.id)
      }

      toast.success('Conflit résolu avec succès!')

    } catch (error) {
      console.error('Erreur lors de la résolution du conflit:', error)
      toast.error(`Erreur: ${(error as Error).message}`)
    } finally {
      setIsResolving(false)
    }
  }, [conflicts, supabase])

  // === RÉSOLUTION AUTOMATIQUE DE TOUS LES CONFLITS ===
  const autoResolveAllConflicts = useCallback(async () => {
    setIsResolving(true)

    try {
      let resolvedCount = 0

      for (const conflict of conflicts) {
        const resolution = autoResolveConflict(conflict)
        if (resolution) {
          await resolveConflict(resolution)
          resolvedCount++
        }
      }

      if (resolvedCount > 0) {
        toast.success(`${resolvedCount} conflits résolus automatiquement!`)
      }

      // Retourner les conflits non résolus
      return conflicts.filter(c => !autoResolveConflict(c))

    } catch (error) {
      console.error('Erreur lors de la résolution automatique:', error)
      toast.error('Erreur lors de la résolution automatique')
      return conflicts
    } finally {
      setIsResolving(false)
    }
  }, [conflicts, autoResolveConflict, resolveConflict])

  // === FUSION INTELLIGENTE DE DONNÉES ===
  const smartMerge = useCallback((localData: any, serverData: any, strategy: 'local_priority' | 'server_priority' | 'timestamp_priority' = 'local_priority') => {
    const merged = { ...serverData }

    switch (strategy) {
      case 'local_priority':
        // Privilégier les données locales pour les champs modifiés
        Object.keys(localData).forEach(key => {
          if (localData[key] !== serverData[key] && localData[key] !== null && localData[key] !== undefined) {
            merged[key] = localData[key]
          }
        })
        break

      case 'server_priority':
        // Privilégier les données serveur (déjà fait par défaut)
        break

      case 'timestamp_priority':
        // Utiliser l'horodatage pour décider
        if (localData.updated_at > serverData.updated_at) {
          Object.assign(merged, localData)
        }
        break
    }

    return merged
  }, [])

  // === SYNCHRONISATION AVEC GESTION DES CONFLITS ===
  const syncWithConflictResolution = useCallback(async () => {
    try {
      // 1. Détecter les conflits
      const detectedConflicts = await detectConflicts()
      
      if (detectedConflicts.length === 0) {
        // Pas de conflits, synchronisation normale
        return { success: true, conflicts: 0 }
      }

      // 2. Essayer de résoudre automatiquement
      const unresolvedConflicts = await autoResolveAllConflicts()

      // 3. Notifier l'utilisateur s'il reste des conflits
      if (unresolvedConflicts.length > 0) {
        toast.warning(`${unresolvedConflicts.length} conflits nécessitent votre attention`)
      }

      return { 
        success: true, 
        conflicts: detectedConflicts.length,
        resolved: detectedConflicts.length - unresolvedConflicts.length,
        remaining: unresolvedConflicts.length
      }

    } catch (error) {
      console.error('Erreur lors de la synchronisation avec résolution de conflits:', error)
      return { success: false, error: (error as Error).message }
    }
  }, [detectConflicts, autoResolveAllConflicts])

  // === EFFETS ===
  useEffect(() => {
    // Vérifier périodiquement les conflits
    const interval = setInterval(() => {
      if (navigator.onLine) {
        detectConflicts()
      }
    }, 2 * 60 * 1000) // Toutes les 2 minutes

    return () => clearInterval(interval)
  }, [detectConflicts])

  return {
    conflicts,
    isResolving,
    detectConflicts,
    resolveConflict,
    autoResolveAllConflicts,
    smartMerge,
    syncWithConflictResolution
  }
}
