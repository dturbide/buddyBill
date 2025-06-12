'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { offlineStorage, useOnlineStatus } from '@/lib/offline-storage'
import { toast } from 'sonner'

export interface OfflineExpense {
  group_id: string
  description: string
  amount: number
  currency: string
  paid_by: string
  expense_date: string
  participants: string[]
  category?: string
  notes?: string
}

export interface OfflineGroup {
  name: string
  description?: string
  currency: string
  members: string[]
}

export function useOfflineExpenses() {
  const [isCreating, setIsCreating] = useState(false)
  const isOnline = useOnlineStatus()
  const supabase = createClient()

  // === CRÉATION DE DÉPENSE OFFLINE/ONLINE ===
  const createExpense = useCallback(async (expenseData: OfflineExpense) => {
    setIsCreating(true)

    try {
      if (isOnline) {
        // Mode en ligne : création directe
        const { data, error } = await supabase
          .from('expenses')
          .insert([{
            group_id: expenseData.group_id,
            description: expenseData.description,
            amount: expenseData.amount,
            currency: expenseData.currency,
            paid_by: expenseData.paid_by,
            expense_date: expenseData.expense_date,
            category: expenseData.category,
            notes: expenseData.notes
          }])
          .select()
          .single()

        if (error) throw error

        // Ajouter les participants
        if (expenseData.participants.length > 0) {
          const participants = expenseData.participants.map(userId => ({
            expense_id: data.id,
            user_id: userId
          }))

          const { error: participantsError } = await supabase
            .from('expense_participants')
            .insert(participants)

          if (participantsError) {
            console.error('Erreur lors de l\'ajout des participants:', participantsError)
          }
        }

        toast.success('Dépense créée avec succès!')
        return { success: true, data, isOffline: false }

      } else {
        // Mode hors-ligne : ajouter à la queue
        const actionId = await offlineStorage.addPendingAction({
          type: 'CREATE_EXPENSE',
          data: {
            ...expenseData,
            // Générer un ID temporaire unique
            temp_id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          }
        })

        // Ajouter à la cache locale pour affichage immédiat
        const tempExpense = {
          id: `temp_${actionId}`,
          group_id: expenseData.group_id,
          description: expenseData.description,
          amount: expenseData.amount,
          currency: expenseData.currency,
          paid_by: expenseData.paid_by,
          expense_date: expenseData.expense_date,
          created_at: new Date().toISOString(),
          cached_at: Date.now(),
          participants: expenseData.participants,
          // Marquer comme en attente
          _pending: true,
          _temp_id: actionId
        }

        await offlineStorage.cacheExpenses([tempExpense])

        toast.info('Dépense sauvegardée hors-ligne. Elle sera synchronisée automatiquement.')
        return { success: true, data: tempExpense, isOffline: true }
      }
    } catch (error) {
      console.error('Erreur lors de la création de la dépense:', error)
      toast.error(`Erreur: ${(error as Error).message}`)
      return { success: false, error: (error as Error).message, isOffline: false }
    } finally {
      setIsCreating(false)
    }
  }, [isOnline, supabase])

  // === CRÉATION DE GROUPE OFFLINE/ONLINE ===
  const createGroup = useCallback(async (groupData: OfflineGroup) => {
    setIsCreating(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      if (isOnline) {
        // Mode en ligne : création directe
        const { data, error } = await supabase
          .from('groups')
          .insert([{
            name: groupData.name,
            description: groupData.description,
            currency: groupData.currency,
            created_by: user.id
          }])
          .select()
          .single()

        if (error) throw error

        // Ajouter les membres
        const members = groupData.members.map(userId => ({
          group_id: data.id,
          user_id: userId,
          role: userId === user.id ? 'admin' : 'member'
        }))

        const { error: membersError } = await supabase
          .from('group_members')
          .insert(members)

        if (membersError) {
          console.error('Erreur lors de l\'ajout des membres:', membersError)
        }

        toast.success('Groupe créé avec succès!')
        return { success: true, data, isOffline: false }

      } else {
        // Mode hors-ligne : ajouter à la queue
        const actionId = await offlineStorage.addPendingAction({
          type: 'CREATE_GROUP',
          data: {
            ...groupData,
            created_by: user.id,
            temp_id: `temp_group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          }
        })

        // Ajouter à la cache locale
        const tempGroup = {
          id: `temp_${actionId}`,
          name: groupData.name,
          description: groupData.description,
          currency: groupData.currency,
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          members: groupData.members,
          cached_at: Date.now(),
          // Marquer comme en attente
          _pending: true,
          _temp_id: actionId
        }

        await offlineStorage.cacheGroups([tempGroup])

        toast.info('Groupe sauvegardé hors-ligne. Il sera synchronisé automatiquement.')
        return { success: true, data: tempGroup, isOffline: true }
      }
    } catch (error) {
      console.error('Erreur lors de la création du groupe:', error)
      toast.error(`Erreur: ${(error as Error).message}`)
      return { success: false, error: (error as Error).message, isOffline: false }
    } finally {
      setIsCreating(false)
    }
  }, [isOnline, supabase])

  // === MODIFICATION DE DÉPENSE ===
  const updateExpense = useCallback(async (expenseId: string, updates: Partial<OfflineExpense>) => {
    setIsCreating(true)

    try {
      if (isOnline) {
        // Mode en ligne : modification directe
        const { data, error } = await supabase
          .from('expenses')
          .update(updates)
          .eq('id', expenseId)
          .select()
          .single()

        if (error) throw error

        toast.success('Dépense modifiée avec succès!')
        return { success: true, data, isOffline: false }

      } else {
        // Mode hors-ligne : ajouter à la queue
        await offlineStorage.addPendingAction({
          type: 'UPDATE_EXPENSE',
          data: {
            id: expenseId,
            updates
          }
        })

        toast.info('Modification sauvegardée hors-ligne. Elle sera synchronisée automatiquement.')
        return { success: true, data: null, isOffline: true }
      }
    } catch (error) {
      console.error('Erreur lors de la modification de la dépense:', error)
      toast.error(`Erreur: ${(error as Error).message}`)
      return { success: false, error: (error as Error).message, isOffline: false }
    } finally {
      setIsCreating(false)
    }
  }, [isOnline, supabase])

  // === SUPPRESSION DE DÉPENSE ===
  const deleteExpense = useCallback(async (expenseId: string) => {
    setIsCreating(true)

    try {
      if (isOnline) {
        // Mode en ligne : suppression directe
        const { error } = await supabase
          .from('expenses')
          .delete()
          .eq('id', expenseId)

        if (error) throw error

        toast.success('Dépense supprimée avec succès!')
        return { success: true, isOffline: false }

      } else {
        // Mode hors-ligne : ajouter à la queue
        await offlineStorage.addPendingAction({
          type: 'DELETE_EXPENSE',
          data: { id: expenseId }
        })

        toast.info('Suppression sauvegardée hors-ligne. Elle sera synchronisée automatiquement.')
        return { success: true, isOffline: true }
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la dépense:', error)
      toast.error(`Erreur: ${(error as Error).message}`)
      return { success: false, error: (error as Error).message, isOffline: false }
    } finally {
      setIsCreating(false)
    }
  }, [isOnline, supabase])

  // === RÉCUPÉRATION DES DONNÉES (CACHE + SERVEUR) ===
  const getExpenses = useCallback(async (groupId?: string) => {
    try {
      // Toujours récupérer d'abord du cache
      const cachedExpenses = await offlineStorage.getCachedExpenses(groupId)
      
      if (isOnline) {
        // Si en ligne, essayer de récupérer les données fraîches
        try {
          let query = supabase
            .from('expenses')
            .select(`
              id, group_id, description, amount, currency, paid_by, expense_date, created_at,
              expense_participants!inner(user_id)
            `)
            .order('expense_date', { ascending: false })

          if (groupId) {
            query = query.eq('group_id', groupId)
          }

          const { data: freshExpenses, error } = await query

          if (error) throw error

          // Transformer les données fraîches
          const transformedExpenses = freshExpenses?.map(expense => ({
            id: expense.id,
            group_id: expense.group_id,
            description: expense.description,
            amount: expense.amount,
            currency: expense.currency,
            paid_by: expense.paid_by,
            expense_date: expense.expense_date,
            created_at: expense.created_at,
            cached_at: Date.now(),
            participants: expense.expense_participants.map((p: any) => p.user_id)
          })) || []

          // Mettre à jour le cache
          await offlineStorage.cacheExpenses(transformedExpenses)

          return transformedExpenses
        } catch (error) {
          console.warn('Erreur de récupération en ligne, utilisation du cache:', error)
          return cachedExpenses
        }
      } else {
        // Hors ligne : utiliser uniquement le cache
        return cachedExpenses
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des dépenses:', error)
      return []
    }
  }, [isOnline, supabase])

  const getGroups = useCallback(async () => {
    try {
      // Toujours récupérer d'abord du cache
      const cachedGroups = await offlineStorage.getCachedGroups()
      
      if (isOnline) {
        // Si en ligne, essayer de récupérer les données fraîches
        try {
          const { data: freshGroups, error } = await supabase
            .from('groups')
            .select(`
              id, name, description, currency, created_by, created_at, updated_at,
              group_members!inner(user_id)
            `)
            .order('updated_at', { ascending: false })

          if (error) throw error

          const transformedGroups = freshGroups?.map(group => ({
            id: group.id,
            name: group.name,
            description: group.description,
            currency: group.currency,
            created_by: group.created_by,
            created_at: group.created_at,
            updated_at: group.updated_at,
            members: group.group_members.map((m: any) => m.user_id),
            cached_at: Date.now()
          })) || []

          // Mettre à jour le cache
          await offlineStorage.cacheGroups(transformedGroups)

          return transformedGroups
        } catch (error) {
          console.warn('Erreur de récupération en ligne, utilisation du cache:', error)
          return cachedGroups
        }
      } else {
        // Hors ligne : utiliser uniquement le cache
        return cachedGroups
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des groupes:', error)
      return []
    }
  }, [isOnline, supabase])

  return {
    // État
    isCreating,
    isOnline,

    // Actions CRUD
    createExpense,
    updateExpense,
    deleteExpense,
    createGroup,

    // Récupération de données
    getExpenses,
    getGroups
  }
}
