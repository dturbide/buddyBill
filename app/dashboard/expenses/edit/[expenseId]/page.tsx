"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

interface ExpenseData {
  id: string
  description: string
  amount: number
  currency: string
  expense_date: string
  group_id: string
  category_id?: string
  notes?: string
}

interface Category {
  id: string
  name: string
}

export default function EditExpensePage() {
  const router = useRouter()
  const params = useParams()
  const expenseId = params.expenseId as string
  
  const [expense, setExpense] = useState<ExpenseData | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // États du formulaire
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [expenseDate, setExpenseDate] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (expenseId) {
      loadExpense()
      loadCategories()
    }
  }, [expenseId])

  const loadExpense = async () => {
    try {
      const response = await fetch(`/api/expenses/${expenseId}`)
      if (response.ok) {
        const { expense } = await response.json()
        setExpense(expense)
        
        // Pré-remplir le formulaire
        setDescription(expense.description || '')
        setAmount(expense.amount?.toString() || '')
        setCurrency(expense.currency || 'USD')
        setExpenseDate(expense.expense_date || '')
        setCategoryId(expense.category_id || '')
        setNotes(expense.notes || '')
      } else {
        setError('Dépense non trouvée')
      }
    } catch (error) {
      console.error('Erreur chargement dépense:', error)
      setError('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const { categories } = await response.json()
        setCategories(categories || [])
      }
    } catch (error) {
      console.error('Erreur chargement catégories:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!description.trim() || !amount || parseFloat(amount) <= 0) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }

    setSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/expenses/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expenseId,
          description: description.trim(),
          amount: parseFloat(amount),
          currency,
          expense_date: expenseDate,
          category_id: categoryId || null,
          notes: notes.trim() || null
        })
      })

      if (response.ok) {
        router.push('/dashboard/expenses')
      } else {
        const data = await response.json()
        setError(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Erreur mise à jour:', error)
      setError('Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement de la dépense...</p>
        </div>
      </div>
    )
  }

  if (error && !expense) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Link href="/dashboard/expenses">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux dépenses
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/expenses">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modifier la dépense</h1>
          <p className="text-gray-600">Modifiez les détails de votre dépense</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Détails de la dépense</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Description *
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Dîner au restaurant"
                required
              />
            </div>

            {/* Montant et devise */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Montant *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Devise
                </label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="CAD">CAD ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Date
              </label>
              <Input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />
            </div>

            {/* Catégorie */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Catégorie
              </label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucune catégorie</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Notes
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes supplémentaires..."
                rows={3}
              />
            </div>

            {/* Boutons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
              <Link href="/dashboard/expenses">
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
