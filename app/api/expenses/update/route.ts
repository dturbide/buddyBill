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

    const {
      expenseId,
      description,
      amount,
      currency,
      expense_date,
      category_id,
      notes
    } = await request.json()

    // Validation
    if (!expenseId || !description?.trim() || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Données invalides' },
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
        { error: 'Non autorisé à modifier cette dépense' },
        { status: 403 }
      )
    }

    // Mettre à jour la dépense
    const { error: updateError } = await supabase
      .from('expenses')
      .update({
        description: description.trim(),
        amount: parseFloat(amount),
        currency: currency || 'USD',
        expense_date: expense_date || new Date().toISOString().split('T')[0],
        category_id: category_id || null,
        notes: notes?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', expenseId)

    if (updateError) {
      console.error('Erreur mise à jour dépense:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de la dépense' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Dépense "${description}" mise à jour avec succès`
    })

  } catch (error) {
    console.error('Erreur mise à jour dépense:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
