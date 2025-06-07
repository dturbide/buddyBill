import { getSupabaseServerClientWithAuth } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
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

    const { expenseId } = await request.json()

    if (!expenseId) {
      return NextResponse.json(
        { error: 'ID de la dépense requis' },
        { status: 400 }
      )
    }

    // Vérifier que la dépense existe et appartient à l'utilisateur
    const { data: expense, error: checkError } = await supabase
      .from('expenses')
      .select('id, created_by, description')
      .eq('id', expenseId)
      .single()

    if (checkError || !expense) {
      return NextResponse.json(
        { error: 'Dépense non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (expense.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Non autorisé à supprimer cette dépense' },
        { status: 403 }
      )
    }

    // Supprimer d'abord les participants de la dépense
    const { error: participantsError } = await supabase
      .from('expense_participants')
      .delete()
      .eq('expense_id', expenseId)

    if (participantsError) {
      console.error('Erreur suppression participants:', participantsError)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression des participants' },
        { status: 500 }
      )
    }

    // Supprimer la dépense
    const { error: deleteError } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId)

    if (deleteError) {
      console.error('Erreur suppression dépense:', deleteError)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression de la dépense' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Dépense "${expense.description}" supprimée avec succès`
    })

  } catch (error) {
    console.error('Erreur suppression dépense:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
