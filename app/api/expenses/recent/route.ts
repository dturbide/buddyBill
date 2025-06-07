import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClientWithAuth } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClientWithAuth()
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer les dépenses récentes (30 derniers jours)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // D'abord récupérer les groupes de l'utilisateur
    const { data: memberships, error: membershipsError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id)
      .is('left_at', null)

    if (membershipsError || !memberships || memberships.length === 0) {
      console.log('DEBUG recent expenses - pas de groupes:', membershipsError)
      return NextResponse.json({ success: true, data: [] })
    }

    const groupIds = memberships.map(m => m.group_id)

    // Pour débuter, récupérons les dépenses sans jointures
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select(`
        id,
        description,
        amount,
        currency,
        expense_date,
        group_id,
        paid_by,
        category_id,
        status
      `)
      .in('group_id', groupIds)
      .gte('expense_date', thirtyDaysAgo.toISOString())
      .order('expense_date', { ascending: false })
      .limit(20)

    if (expensesError) {
      console.error('Erreur récupération dépenses:', expensesError)
      return NextResponse.json({ error: 'Erreur récupération dépenses' }, { status: 500 })
    }

    // Enrichir avec les noms de groupes si nécessaire
    const expensesWithGroups = expenses?.map(expense => ({
      ...expense,
      groupName: 'Group ' + expense.group_id // Simplifié pour l'instant
    }))

    return NextResponse.json({ 
      success: true,
      data: expensesWithGroups || [] 
    })

  } catch (error) {
    console.error('Erreur API dépenses récentes:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur serveur interne' 
    }, { status: 500 })
  }
}
