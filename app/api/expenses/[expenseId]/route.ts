import { getSupabaseServerClientWithAuth } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  try {
    const { expenseId } = await params
    const supabase = await getSupabaseServerClientWithAuth()
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer la dépense avec les détails
    const { data: expense, error: expenseError } = await supabase
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
      .eq('id', expenseId)
      .single()

    if (expenseError || !expense) {
      return NextResponse.json(
        { error: 'Dépense non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier que l'utilisateur peut voir cette dépense (membre du groupe)
    const { data: membership, error: membershipError } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', expense.group_id)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Non autorisé à voir cette dépense' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      expense: {
        id: expense.id,
        description: expense.description,
        amount: expense.amount,
        currency: expense.currency || 'USD',
        expense_date: expense.expense_date,
        created_by: expense.created_by,
        group_id: expense.group_id,
        group_name: expense.groups?.name || 'Groupe inconnu',
        category_id: expense.category_id,
        notes: expense.notes
      }
    })

  } catch (error) {
    console.error('Erreur API récupération dépense:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
