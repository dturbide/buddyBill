"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, DollarSign, Users, Calendar, Filter, Edit, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { AppLayout, MobileCard } from '@/components/app-layout'
import Link from 'next/link'

interface Expense {
  id: string
  description: string
  amount: number
  currency: string
  date: string
  created_by: string
  group_id: string
  group_name: string
  created_by_name: string
  category?: string
}

interface Group {
  id: string
  name: string
}

export default function ExpensesListScreen() {
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Charger les données initiales
  useEffect(() => {
    loadExpenses()
    loadGroups()
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const response = await fetch('/api/auth/user')
      if (response.ok) {
        const { user } = await response.json()
        setCurrentUserId(user.id)
      } else {
        console.error('Utilisateur non authentifié:', response.status)
        setError('Utilisateur non authentifié')
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error)
      setError('Erreur de connexion utilisateur')
    }
  }

  const loadExpenses = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/expenses')
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Erreur API dépenses:', response.status, errorText)
        alert(`Erreur de chargement: ${response.status}`)
        setExpenses([])
        setError(`Erreur de chargement: ${response.status}`)
        return
      }
      
      const data = await response.json()
      console.log('Données reçues:', data)
      
      if (data.success && data.expenses) {
        setExpenses(data.expenses)
      } else {
        console.error('Format de données invalide:', data)
        setExpenses([])
        setError('Format de données invalide')
      }
    } catch (error) {
      console.error('Erreur chargement dépenses:', error)
      alert('Erreur de connexion')
      setExpenses([])
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const loadGroups = async () => {
    try {
      const response = await fetch('/api/groups')
      if (response.ok) {
        const { groups } = await response.json()
        setGroups(groups || [])
      }
    } catch (error) {
      console.error('Erreur chargement groupes:', error)
    }
  }

  const deleteExpense = async (expenseId: string) => {
    try {
      const response = await fetch('/api/expenses/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expenseId })
      })

      if (response.ok) {
        setExpenses(prev => prev.filter(exp => exp.id !== expenseId))
      } else {
        alert('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur suppression:', error)
      alert('Erreur lors de la suppression')
    }
  }

  // Filtrer les dépenses
  const filteredExpenses = expenses.filter(expense => {
    const matchesGroup = selectedGroup === 'all' || expense.group_id === selectedGroup
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.group_name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesGroup && matchesSearch
  })

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    })
  }

  const canEditOrDelete = (expense: Expense) => {
    return expense.created_by === currentUserId
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement des dépenses...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-red-600">{error}</p>
          <p className="mt-2 text-gray-600">Veuillez réessayer plus tard.</p>
        </div>
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-3 text-sm sm:text-base">
            Aucune dépense trouvée
          </p>
          <Link href="/dashboard/expenses/add">
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une dépense
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <AppLayout title="Mes Dépenses">
      <MobileCard>
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Mes Dépenses</h1>
            <p className="text-xs text-gray-600 sm:text-sm">Gérez vos dépenses partagées</p>
          </div>
          <Link href="/dashboard/expenses/add" className="w-full sm:w-auto">
            <Button className="w-full bg-blue-500 hover:bg-blue-600 h-10 text-sm sm:w-auto sm:h-9">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Nouvelle Dépense</span>
              <span className="sm:hidden">Ajouter</span>
            </Button>
          </Link>
        </div>
      </MobileCard>

      <MobileCard>
        <h2 className="font-medium text-gray-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
          <Filter className="h-4 w-4" />
          Filtres
        </h2>
        <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
          {/* Filtre par groupe */}
          <div>
            <label className="text-xs font-medium mb-1 block text-gray-700 sm:text-sm">Groupe</label>
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger className="h-9 text-sm sm:h-10">
                <SelectValue placeholder="Tous les groupes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les groupes</SelectItem>
                {groups.map(group => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recherche */}
          <div>
            <label className="text-xs font-medium mb-1 block text-gray-700 sm:text-sm">Recherche</label>
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 text-sm sm:h-10"
            />
          </div>
        </div>
      </MobileCard>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <MobileCard>
          <div className="text-center">
            <div className="w-6 h-6 bg-blue-100 rounded-lg mx-auto mb-1 flex items-center justify-center sm:w-8 sm:h-8 sm:mb-2">
              <DollarSign className="h-3 w-3 text-blue-600 sm:h-4 sm:w-4" />
            </div>
            <p className="text-xs text-gray-600 mb-1 sm:text-sm">Total</p>
            <p className="text-xs font-semibold text-gray-900 truncate sm:text-sm">
              {formatCurrency(filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)).replace('$', '$')}
            </p>
          </div>
        </MobileCard>

        <MobileCard>
          <div className="text-center">
            <div className="w-6 h-6 bg-green-100 rounded-lg mx-auto mb-1 flex items-center justify-center sm:w-8 sm:h-8 sm:mb-2">
              <Users className="h-3 w-3 text-green-600 sm:h-4 sm:w-4" />
            </div>
            <p className="text-xs text-gray-600 mb-1 sm:text-sm">Groupes</p>
            <p className="text-xs font-semibold text-gray-900 sm:text-sm">{groups.length}</p>
          </div>
        </MobileCard>

        <MobileCard>
          <div className="text-center">
            <div className="w-6 h-6 bg-purple-100 rounded-lg mx-auto mb-1 flex items-center justify-center sm:w-8 sm:h-8 sm:mb-2">
              <Calendar className="h-3 w-3 text-purple-600 sm:h-4 sm:w-4" />
            </div>
            <p className="text-xs text-gray-600 mb-1 sm:text-sm">Dépenses</p>
            <p className="text-xs font-semibold text-gray-900 sm:text-sm">{filteredExpenses.length}</p>
          </div>
        </MobileCard>
      </div>

      <MobileCard>
        <h2 className="font-medium text-gray-900 text-sm sm:text-base">
          Dépenses ({filteredExpenses.length})
        </h2>
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <DollarSign className="h-10 w-10 text-gray-400 mx-auto mb-2 sm:h-12 sm:w-12 sm:mb-3" />
            <p className="text-gray-500 mb-2 text-xs sm:text-sm sm:mb-3">
              Aucune dépense ne correspond aux filtres
            </p>
            <Link href="/dashboard/expenses/add">
              <Button className="w-full text-sm sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une dépense
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {filteredExpenses.map((expense) => (
              <div
                key={expense.id}
                className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors border border-gray-200"
              >
                {/* Layout mobile: tout en vertical */}
                <div className="space-y-2">
                  {/* Première ligne: titre et badge */}
                  <div className="flex flex-wrap items-start gap-2">
                    <h3 className="font-medium text-gray-900 flex-1 min-w-0 text-sm">
                      {expense.description}
                    </h3>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {expense.group_name}
                    </Badge>
                  </div>

                  {/* Deuxième ligne: montant et actions */}
                  <div className="flex items-center justify-between">
                    <p className="text-base font-bold text-blue-600 sm:text-lg">
                      {formatCurrency(expense.amount, expense.currency)}
                    </p>
                    
                    {/* Actions sur mobile */}
                    {canEditOrDelete(expense) && (
                      <div className="flex gap-1">
                        <Link href={`/dashboard/expenses/edit/${expense.id}`}>
                          <Button size="sm" variant="outline" className="h-7 w-7 p-0 sm:h-8 sm:w-8">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </Link>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 sm:h-8 sm:w-8">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="mx-3 max-w-sm sm:mx-auto sm:max-w-lg">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-sm sm:text-base">Confirmer la suppression</AlertDialogTitle>
                              <AlertDialogDescription className="text-xs sm:text-sm">
                                Êtes-vous sûr de vouloir supprimer cette dépense ? Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex flex-col gap-2 sm:flex-row">
                              <AlertDialogCancel className="text-sm">Annuler</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteExpense(expense.id)}
                                className="bg-red-600 hover:bg-red-700 text-sm"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>

                  {/* Troisième ligne: informations */}
                  <div className="flex items-center justify-between text-xs text-gray-500 sm:text-sm">
                    <span>{formatDate(expense.date)}</span>
                    <span>Par {expense.created_by_name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </MobileCard>
    </AppLayout>
  )
}
