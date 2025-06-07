"use client"

import AddExpenseScreen from "@/components/add-expense-screen"
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AddExpensePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [groupContext, setGroupContext] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const groupId = searchParams.get('groupId')
    const groupName = searchParams.get('groupName')

    if (!groupId || !groupName) {
      // Rediriger vers le dashboard si pas de groupe sélectionné
      router.push('/dashboard')
      return
    }

    // Créer un contexte de groupe simplifié
    const mockGroupContext = {
      id: groupId,
      name: decodeURIComponent(groupName),
      defaultCurrency: 'USD',
      members: [
        {
          id: 'user1',
          name: 'Vous',
          email: 'you@example.com',
          isCurrentUser: true
        }
      ]
    }

    setGroupContext(mockGroupContext)
    setLoading(false)
  }, [searchParams, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!groupContext) {
    return null
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-100 p-4">
      <AddExpenseScreen groupContext={groupContext} />
    </div>
  )
}
