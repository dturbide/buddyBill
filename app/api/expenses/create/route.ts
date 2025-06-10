import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClientWithAuth } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { groupId, description, amount, categoryId, paidBy, participants, splitType, currency } = await request.json()
    
    console.log("DEBUG Expense: Données reçues:", { groupId, description, amount, categoryId, paidBy, participants, splitType, currency })

    // Utiliser le client avec authentification
    const supabase = await getSupabaseServerClientWithAuth()
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Non autorisé' 
      }, { status: 401 })
    }

    if (!groupId || !description || !amount) {
      return NextResponse.json({ 
        error: 'Paramètres manquants' 
      }, { status: 400 })
    }

    // Validation et conversion de devise pour éviter l'erreur enum
    const supportedCurrencies = ['EUR', 'USD', 'GBP', 'CAD']
    const validatedCurrency = currency && supportedCurrencies.includes(currency) ? currency : 'USD'
    
    if (currency && !supportedCurrencies.includes(currency)) {
      console.warn(`Devise ${currency} non supportée par l'enum DB, conversion vers USD`)
    }

    // Vérifier que l'utilisateur est membre du groupe
    const { data: membership, error: membershipError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .is('left_at', null)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ 
        error: 'Vous n\'êtes pas membre de ce groupe' 
      }, { status: 403 })
    }

    // Récupérer les membres du groupe pour les participants
    const { data: groupMembers, error: membersError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .is('left_at', null)

    if (membersError) {
      return NextResponse.json({ 
        error: 'Erreur lors de la récupération des membres du groupe' 
      }, { status: 500 })
    }

    console.log("DEBUG Expense: Membres du groupe:", groupMembers)

    // Créer la dépense directement
    const expenseData = {
      group_id: groupId,
      description,
      amount: parseFloat(amount),
      category_id: (categoryId && categoryId.length > 10) ? categoryId : null,
      paid_by: user.id,
      currency: validatedCurrency,
      split_type: splitType || 'equal',
      created_by: user.id,
      expense_date: new Date().toISOString()
    }

    console.log("DEBUG Expense: Tentative insertion dépense avec données:", expenseData)

    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert(expenseData)
      .select()
      .single()

    console.log("DEBUG Expense: Résultat insertion dépense:", { expense, expenseError })

    if (expenseError) {
      console.error("Erreur création dépense:", expenseError)
      return NextResponse.json({ 
        error: "Erreur lors de la création de la dépense", 
        details: expenseError 
      }, { status: 500 })
    }

    // AJOUTER AUTOMATIQUEMENT TOUS LES MEMBRES COMME PARTICIPANTS
    if (groupMembers && expense.id) {
      const sharePerPerson = parseFloat(amount) / groupMembers.length
      
      console.log("DEBUG Expense: Ajout participants:", {
        expenseId: expense.id,
        participantCount: groupMembers.length,
        sharePerPerson: sharePerPerson.toFixed(2)
      })

      // Préparer les données des participants
      const participantsData = groupMembers.map(member => ({
        expense_id: expense.id,
        user_id: member.user_id,
        share_amount: sharePerPerson,
        is_settled: false
      }))

      // Insérer les participants directement
      const { data: participantsResult, error: participantsError } = await supabase
        .from('expense_participants')
        .insert(participantsData)

      if (participantsError) {
        console.error("Erreur insertion participants:", participantsError)
        console.warn("Dépense créée mais participants non ajoutés")
      } else {
        console.log("DEBUG Expense: Participants ajoutés avec succès", participantsResult ? (Array.isArray(participantsResult) ? participantsResult.length : 1) : 'participants insérés')
      }
    }

    // Succès
    return NextResponse.json({ 
      message: "Dépense créée avec succès",
      expense: {
        id: expense.id,
        amount: expense.amount,
        currency: expense.currency
      }
    })

  } catch (error) {
    console.error('Erreur API création dépense:', error)
    return NextResponse.json({ 
      error: 'Erreur serveur interne' 
    }, { status: 500 })
  }
}
