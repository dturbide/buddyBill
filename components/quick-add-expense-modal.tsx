'use client'

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { useNotifications } from '@/components/notification-system'
import { X, DollarSign, Receipt } from 'lucide-react'

interface QuickAddExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  groupId: string
  groupName: string
  defaultCurrency?: string
  onSuccess?: () => void
}

export default function QuickAddExpenseModal({ 
  isOpen, 
  onClose, 
  groupId, 
  groupName,
  defaultCurrency = 'EUR',
  onSuccess 
}: QuickAddExpenseModalProps) {
  const { t } = useTranslation(['dashboard', 'common'])
  const { showSuccess, showError } = useNotifications()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    currency: defaultCurrency,
    notes: ''
  })

  // Mettre à jour la devise par défaut quand le prop change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      currency: defaultCurrency
    }))
  }, [defaultCurrency])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.description.trim() || !formData.amount) {
      showError('Veuillez remplir les champs obligatoires')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        showError('Vous devez être connecté')
        return
      }

      const response = await fetch('/api/expenses/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId,
          description: formData.description.trim(),
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          notes: formData.notes.trim(),
          splitType: 'equal',
          participants: [] // Will be handled by the API
        }),
      })

      if (response.ok) {
        showSuccess('Dépense ajoutée avec succès !')
        
        // Reset form
        setFormData({
          description: '',
          amount: '',
          currency: defaultCurrency,
          notes: ''
        })
        
        // Close modal and refresh data
        onClose()
        onSuccess?.()
      } else {
        const errorData = await response.json()
        showError('Erreur lors de l\'ajout de la dépense', errorData.error)
      }
    } catch (error) {
      console.error('Error adding expense:', error)
      showError('Erreur lors de l\'ajout de la dépense')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-blue-600" />
            Ajouter une dépense
          </DialogTitle>
          <p className="text-sm text-gray-500">
            Groupe : <span className="font-medium">{groupName}</span>
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              placeholder="Ex: Restaurant, Courses..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              required
            />
          </div>

          {/* Amount and Currency */}
          <div className="flex gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="amount">Montant *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="pl-10"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="w-24 space-y-2">
              <Label htmlFor="currency">Devise</Label>
              <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Informations supplémentaires..."
              rows={2}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Ajout...' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
