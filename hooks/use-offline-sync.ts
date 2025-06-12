'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { offlineStorage, CachedGroup, CachedExpense, CachedUser, PendingAction, useOnlineStatus } from '@/lib/offline-storage'

interface SyncStatus {
  isLoading: boolean
  lastSync: Date | null
  pendingActions: number
  error: string | null
  cacheSizes: { groups: number; expenses: number; users: number; actions: number }
}

export function useOfflineSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isLoading: false,
    lastSync: null,
    pendingActions: 0,
    error: null,
    cacheSizes: { groups: 0, expenses: 0, users: 0, actions: 0 }
  })

  const isOnline = useOnlineStatus()
  const supabase = createClient()

  // === PHASE 1: SYNCHRONISATION CACHE INTELLIGENT ===
  const syncFromServer = useCallback(async () => {
    if (!isOnline) return

    setSyncStatus(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // 1. Synchroniser les groupes de l'utilisateur
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select(`
          id, name, description, currency, created_by, created_at, updated_at,
          group_members!inner(user_id)
        `)
        .order('updated_at', { ascending: false })
        .limit(50) // Limiter aux 50 groupes les plus récents

      if (groupsError) throw groupsError

      const cachedGroups: CachedGroup[] = groupsData?.map(group => ({
        id: group.id,
        name: group.name,
        description: group.description,
        currency: group.currency,
        created_by: group.created_by,
        created_at: group.created_at,
        updated_at: group.updated_at,
        members: group.group_members?.map((m: any) => m.user_id) || [],
        cached_at: Date.now()
      })) || []

      await offlineStorage.cacheGroups(cachedGroups)

      // 2. Synchroniser les dépenses des 30 derniers jours
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select(`
          id, group_id, description, amount, currency, paid_by, expense_date, created_at,
          expense_participants!inner(user_id)
        `)
        .gte('expense_date', thirtyDaysAgo.toISOString())
        .order('expense_date', { ascending: false })
        .limit(500) // Limiter aux 500 dépenses les plus récentes

      if (expensesError) throw expensesError

      const cachedExpenses: CachedExpense[] = expensesData?.map(expense => ({
        id: expense.id,
        group_id: expense.group_id,
        description: expense.description,
        amount: expense.amount,
        currency: expense.currency,
        paid_by: expense.paid_by,
        expense_date: expense.expense_date,
        created_at: expense.created_at,
        cached_at: Date.now(),
        participants: expense.expense_participants?.map((p: any) => p.user_id) || []
      })) || []

      await offlineStorage.cacheExpenses(cachedExpenses)

      // 3. Synchroniser le profil utilisateur
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('full_name, avatar_url, preferred_currency')
          .eq('id', authUser.id)
          .single()

        const cachedUser: CachedUser = {
          id: authUser.id,
          name: profileData?.full_name || authUser.email?.split('@')[0] || 'Utilisateur',
          email: authUser.email || '',
          avatar_url: profileData?.avatar_url,
          preferred_currency: profileData?.preferred_currency || 'CAD',
          cached_at: Date.now()
        }

        await offlineStorage.cacheUser(cachedUser)
      }

      // Mettre à jour les métadonnées
      await offlineStorage.setMetadata('last_sync', new Date().toISOString())
      
      // Nettoyer le cache ancien
      await offlineStorage.cleanOldCache()

      setSyncStatus(prev => ({ 
        ...prev, 
        isLoading: false, 
        lastSync: new Date(),
        error: null 
      }))

    } catch (error) {
      console.error('Erreur de synchronisation:', error)
      setSyncStatus(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: (error as Error).message 
      }))
    }
  }, [isOnline, supabase])

  // === PHASE 2: SYNCHRONISATION DES ACTIONS EN ATTENTE ===
  const syncPendingActions = useCallback(async () => {
    if (!isOnline) return

    const pendingActions = await offlineStorage.getPendingActions()
    
    for (const action of pendingActions) {
      try {
        switch (action.type) {
          case 'CREATE_EXPENSE':
            const { error: createError } = await supabase
              .from('expenses')
              .insert([action.data])
            
            if (createError) throw createError
            break

          case 'UPDATE_EXPENSE':
            const { error: updateError } = await supabase
              .from('expenses')
              .update(action.data.updates)
              .eq('id', action.data.id)
            
            if (updateError) throw updateError
            break

          case 'DELETE_EXPENSE':
            const { error: deleteError } = await supabase
              .from('expenses')
              .delete()
              .eq('id', action.data.id)
            
            if (deleteError) throw deleteError
            break

          case 'CREATE_GROUP':
            const { error: groupError } = await supabase
              .from('groups')
              .insert([action.data])
            
            if (groupError) throw groupError
            break
        }

        // Supprimer l'action réussie
        await offlineStorage.removePendingAction(action.id)
        
      } catch (error) {
        console.error(`Erreur lors de la synchronisation de l'action ${action.id}:`, error)
        
        // Incrémenter le compteur de tentatives
        action.retries++
        action.last_error = (error as Error).message
        
        // Abandonner après 3 tentatives
        if (action.retries >= 3) {
          await offlineStorage.removePendingAction(action.id)
        }
      }
    }
  }, [isOnline, supabase])

  // === FONCTIONS UTILITAIRES ===
  const forceSync = useCallback(async () => {
    await syncFromServer()
    await syncPendingActions()
    await updateSyncStatus()
  }, [syncFromServer, syncPendingActions])

  const updateSyncStatus = useCallback(async () => {
    const pendingActions = await offlineStorage.getPendingActions()
    const cacheSizes = await offlineStorage.getCacheSize()
    const lastSyncStr = await offlineStorage.getMetadata('last_sync')
    
    setSyncStatus(prev => ({
      ...prev,
      pendingActions: pendingActions.length,
      cacheSizes,
      lastSync: lastSyncStr ? new Date(lastSyncStr) : null
    }))
  }, [])

  // === EFFETS ===
  useEffect(() => {
    // Initialiser le stockage offline
    offlineStorage.init().then(() => {
      updateSyncStatus()
    })
  }, [updateSyncStatus])

  useEffect(() => {
    // Synchroniser automatiquement quand on revient en ligne
    if (isOnline) {
      const timer = setTimeout(() => {
        forceSync()
      }, 1000) // Attendre 1s pour éviter les appels trop fréquents

      return () => clearTimeout(timer)
    }
  }, [isOnline, forceSync])

  useEffect(() => {
    // Synchronisation périodique toutes les 5 minutes quand en ligne
    if (isOnline) {
      const interval = setInterval(() => {
        syncFromServer()
      }, 5 * 60 * 1000) // 5 minutes

      return () => clearInterval(interval)
    }
  }, [isOnline, syncFromServer])

  return {
    syncStatus,
    isOnline,
    forceSync,
    syncFromServer,
    syncPendingActions,
    updateSyncStatus
  }
}
