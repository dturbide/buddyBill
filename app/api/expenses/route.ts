import { getSupabaseServerClientWithAuth } from '@/lib/supabase-server'
import { NextResponse, NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClientWithAuth()
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer les dépenses de l'utilisateur avec les détails du groupe et créateur
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select(`
        id,
        description,
        amount,
        currency,
        expense_date,
        created_by,
        group_id,
        category_id,
        created_at
      `)
      .order('expense_date', { ascending: false })

    if (expensesError) {
      console.error('Erreur récupération dépenses:', expensesError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des dépenses' },
        { status: 500 }
      )
    }

    // Récupérer les groupes pour les noms
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id, name')

    if (groupsError) {
      console.error('Erreur récupération groupes:', groupsError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des groupes' },
        { status: 500 }
      )
    }

    // Récupérer les profils utilisateurs pour les noms
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, full_name')

    if (profilesError) {
      console.error('Erreur récupération profils:', profilesError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des profils' },
        { status: 500 }
      )
    }

    // Mapper les données avec les détails
    const expensesWithDetails = expenses?.map(expense => {
      const group = groups?.find(g => g.id === expense.group_id)
      const creator = profiles?.find(p => p.id === expense.created_by)
      
      return {
        id: expense.id,
        description: expense.description,
        amount: expense.amount,
        currency: expense.currency || 'USD',
        date: expense.expense_date,
        created_by: expense.created_by,
        group_id: expense.group_id,
        group_name: group?.name || 'Groupe inconnu',
        created_by_name: creator?.full_name || 'Utilisateur inconnu',
        category: expense.category_id
      }
    }) || []

    return NextResponse.json({
      success: true,
      expenses: expensesWithDetails,
      count: expensesWithDetails.length
    })

  } catch (error) {
    console.error('Erreur API dépenses:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
