'use client'

// Types pour le stockage offline
export interface CachedGroup {
  id: string
  name: string
  description?: string
  currency: string
  created_by: string
  created_at: string
  updated_at: string
  members: string[]
  cached_at: number // timestamp
}

export interface CachedExpense {
  id: string
  group_id: string
  description: string
  amount: number
  currency: string
  paid_by: string
  expense_date: string
  created_at: string
  cached_at: number
  participants: string[]
}

export interface CachedUser {
  id: string
  name: string
  email: string
  avatar_url?: string
  preferred_currency: string
  cached_at: number
}

export interface PendingAction {
  id: string
  type: 'CREATE_EXPENSE' | 'UPDATE_EXPENSE' | 'DELETE_EXPENSE' | 'CREATE_GROUP'
  data: any
  created_at: number
  retries: number
  last_error?: string
}

class OfflineStorage {
  private dbName = 'buddybill-offline'
  private version = 1
  private db: IDBDatabase | null = null

  // Initialiser la base de données IndexedDB
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Store pour les groupes
        if (!db.objectStoreNames.contains('groups')) {
          const groupStore = db.createObjectStore('groups', { keyPath: 'id' })
          groupStore.createIndex('cached_at', 'cached_at')
        }

        // Store pour les dépenses
        if (!db.objectStoreNames.contains('expenses')) {
          const expenseStore = db.createObjectStore('expenses', { keyPath: 'id' })
          expenseStore.createIndex('group_id', 'group_id')
          expenseStore.createIndex('cached_at', 'cached_at')
        }

        // Store pour les utilisateurs
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id' })
          userStore.createIndex('cached_at', 'cached_at')
        }

        // Store pour les actions en attente
        if (!db.objectStoreNames.contains('pending_actions')) {
          const actionStore = db.createObjectStore('pending_actions', { keyPath: 'id' })
          actionStore.createIndex('type', 'type')
          actionStore.createIndex('created_at', 'created_at')
        }

        // Store pour les métadonnées
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' })
        }
      }
    })
  }

  // === GESTION DES GROUPES ===
  async cacheGroups(groups: CachedGroup[]): Promise<void> {
    if (!this.db) await this.init()
    
    const transaction = this.db!.transaction(['groups'], 'readwrite')
    const store = transaction.objectStore('groups')
    
    const now = Date.now()
    for (const group of groups) {
      await store.put({ ...group, cached_at: now })
    }
  }

  async getCachedGroups(): Promise<CachedGroup[]> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['groups'], 'readonly')
      const store = transaction.objectStore('groups')
      const request = store.getAll()
      
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  // === GESTION DES DÉPENSES ===
  async cacheExpenses(expenses: CachedExpense[]): Promise<void> {
    if (!this.db) await this.init()
    
    const transaction = this.db!.transaction(['expenses'], 'readwrite')
    const store = transaction.objectStore('expenses')
    
    const now = Date.now()
    for (const expense of expenses) {
      await store.put({ ...expense, cached_at: now })
    }
  }

  async getCachedExpenses(groupId?: string): Promise<CachedExpense[]> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['expenses'], 'readonly')
      const store = transaction.objectStore('expenses')
      
      if (groupId) {
        const index = store.index('group_id')
        const request = index.getAll(groupId)
        request.onsuccess = () => resolve(request.result || [])
        request.onerror = () => reject(request.error)
      } else {
        const request = store.getAll()
        request.onsuccess = () => resolve(request.result || [])
        request.onerror = () => reject(request.error)
      }
    })
  }

  // === GESTION DES UTILISATEURS ===
  async cacheUser(user: CachedUser): Promise<void> {
    if (!this.db) await this.init()
    
    const transaction = this.db!.transaction(['users'], 'readwrite')
    const store = transaction.objectStore('users')
    
    await store.put({ ...user, cached_at: Date.now() })
  }

  async getCachedUser(userId: string): Promise<CachedUser | null> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['users'], 'readonly')
      const store = transaction.objectStore('users')
      const request = store.get(userId)
      
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  // === ACTIONS EN ATTENTE (Phase 2) ===
  async addPendingAction(action: Omit<PendingAction, 'id' | 'created_at' | 'retries'>): Promise<string> {
    if (!this.db) await this.init()
    
    const id = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const pendingAction: PendingAction = {
      id,
      ...action,
      created_at: Date.now(),
      retries: 0
    }
    
    const transaction = this.db!.transaction(['pending_actions'], 'readwrite')
    const store = transaction.objectStore('pending_actions')
    
    await store.put(pendingAction)
    return id
  }

  async getPendingActions(): Promise<PendingAction[]> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pending_actions'], 'readonly')
      const store = transaction.objectStore('pending_actions')
      const request = store.getAll()
      
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async removePendingAction(actionId: string): Promise<void> {
    if (!this.db) await this.init()
    
    const transaction = this.db!.transaction(['pending_actions'], 'readwrite')
    const store = transaction.objectStore('pending_actions')
    
    await store.delete(actionId)
  }

  // === MÉTADONNÉES ===
  async setMetadata(key: string, value: any): Promise<void> {
    if (!this.db) await this.init()
    
    const transaction = this.db!.transaction(['metadata'], 'readwrite')
    const store = transaction.objectStore('metadata')
    
    await store.put({ key, value, updated_at: Date.now() })
  }

  async getMetadata(key: string): Promise<any> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['metadata'], 'readonly')
      const store = transaction.objectStore('metadata')
      const request = store.get(key)
      
      request.onsuccess = () => resolve(request.result?.value || null)
      request.onerror = () => reject(request.error)
    })
  }

  // === NETTOYAGE DU CACHE ===
  async cleanOldCache(maxAgeMs: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
    if (!this.db) await this.init()
    
    const cutoff = Date.now() - maxAgeMs
    const stores = ['groups', 'expenses', 'users']
    
    for (const storeName of stores) {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const index = store.index('cached_at')
      
      const request = index.openCursor(IDBKeyRange.upperBound(cutoff))
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        }
      }
    }
  }

  // === ÉTAT DE CONNEXION ===
  isOnline(): boolean {
    return navigator.onLine
  }

  // === TAILLE DU CACHE ===
  async getCacheSize(): Promise<{ groups: number; expenses: number; users: number; actions: number }> {
    if (!this.db) await this.init()
    
    const groups = await this.getCachedGroups()
    const expenses = await this.getCachedExpenses()
    const actions = await this.getPendingActions()
    
    return {
      groups: groups.length,
      expenses: expenses.length,
      users: 1, // Approximation
      actions: actions.length
    }
  }
}

// Instance singleton
export const offlineStorage = new OfflineStorage()

// Hook utilitaire pour l'état de connexion
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true) // Valeur par défaut pour éviter l'hydratation
  const [isHydrated, setIsHydrated] = useState(false)
  
  useEffect(() => {
    // Marquer comme hydraté et définir la vraie valeur
    setIsHydrated(true)
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
  
  // Retourner true par défaut jusqu'à l'hydratation
  return isHydrated ? isOnline : true
}

// Utilitaires d'import React
import { useState, useEffect } from 'react'
