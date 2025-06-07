'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Types pour les notifications
export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
  persistent?: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

export interface ConfirmationOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
}

// Context pour les notifications
interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  showSuccess: (title: string, message?: string) => void
  showError: (title: string, message?: string) => void
  showInfo: (title: string, message?: string) => void
  showWarning: (title: string, message?: string) => void
  showConfirmation: (options: ConfirmationOptions) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// Hook pour utiliser le système de notifications
export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

// Composant de notification individuelle
const NotificationItem: React.FC<{ 
  notification: Notification
  onRemove: (id: string) => void 
}> = ({ notification, onRemove }) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-600" />,
    error: <AlertCircle className="w-5 h-5 text-red-600" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
    info: <Info className="w-5 h-5 text-blue-600" />
  }

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200', 
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200'
  }

  React.useEffect(() => {
    if (!notification.persistent && notification.duration !== 0) {
      const timer = setTimeout(() => {
        onRemove(notification.id)
      }, notification.duration || 5000)
      return () => clearTimeout(timer)
    }
  }, [notification, onRemove])

  return (
    <div className={`${bgColors[notification.type]} border rounded-lg p-4 shadow-md animate-in slide-in-from-right duration-300`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {icons[notification.type]}
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{notification.title}</h4>
            {notification.message && (
              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
            )}
            {notification.action && (
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-2"
                onClick={notification.action.onClick}
              >
                {notification.action.label}
              </Button>
            )}
          </div>
        </div>
        <button
          onClick={() => onRemove(notification.id)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Composant de confirmation
const ConfirmationModal: React.FC<{
  options: ConfirmationOptions
  onClose: () => void
}> = ({ options, onClose }) => {
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await options.onConfirm()
      onClose()
    } catch (error) {
      console.error('Erreur lors de la confirmation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    options.onCancel?.()
    onClose()
  }

  const getColors = () => {
    switch (options.type) {
      case 'danger':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
        <div className={`p-6 border-l-4 ${getColors()}`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {options.title}
          </h3>
          <p className="text-gray-600 mb-6">
            {options.message}
          </p>
          <div className="flex gap-3 justify-end">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={isLoading}
            >
              {options.cancelText || 'Annuler'}
            </Button>
            <Button 
              variant={options.type === 'danger' ? 'destructive' : 'default'}
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'En cours...' : (options.confirmText || 'Confirmer')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Provider principal
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [confirmation, setConfirmation] = useState<ConfirmationOptions | null>(null)

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    setNotifications(prev => [...prev, { ...notification, id }])
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const showSuccess = useCallback((title: string, message?: string) => {
    addNotification({ type: 'success', title, message })
  }, [addNotification])

  const showError = useCallback((title: string, message?: string) => {
    addNotification({ type: 'error', title, message, persistent: true })
  }, [addNotification])

  const showInfo = useCallback((title: string, message?: string) => {
    addNotification({ type: 'info', title, message })
  }, [addNotification])

  const showWarning = useCallback((title: string, message?: string) => {
    addNotification({ type: 'warning', title, message })
  }, [addNotification])

  const showConfirmation = useCallback((options: ConfirmationOptions) => {
    setConfirmation(options)
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      showSuccess,
      showError,
      showInfo,
      showWarning,
      showConfirmation,
      clearAll
    }}>
      {children}
      
      {/* Container des notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
        {notifications.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRemove={removeNotification}
          />
        ))}
      </div>

      {/* Modal de confirmation */}
      {confirmation && (
        <ConfirmationModal
          options={confirmation}
          onClose={() => setConfirmation(null)}
        />
      )}
    </NotificationContext.Provider>
  )
}
