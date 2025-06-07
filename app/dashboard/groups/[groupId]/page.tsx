"use client"

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import GroupDetailsScreen from "@/components/group-details-screen"

export default function GroupDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [groupContext, setGroupContext] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const groupId = params.groupId as string

    if (!groupId) {
      router.push('/dashboard')
      return
    }

    // Pour l'instant, utilisons un contexte de groupe simulé
    // En production, récupérer les vraies données depuis l'API
    const mockGroupContext = {
      id: groupId,
      name: "Groupe", // Récupérer le vrai nom depuis l'API
      defaultCurrency: 'USD',
      members: [
        {
          id: 'user1',
          name: 'Vous',
          email: 'you@example.com',
          isCurrentUser: true,
          balance: 25.50
        }
        // Ajouter d'autres membres depuis l'API
      ],
      totalExpenses: 100.00,
      yourShare: 50.00
    }

    setGroupContext(mockGroupContext)
    setLoading(false)
  }, [params.groupId, router])

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

  return <GroupDetailsScreen group={groupContext} />
}
