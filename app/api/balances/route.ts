import { getSupabaseServerClientWithAuth } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('DEBUG API balances - Début de la requête')
    
    const supabase = await getSupabaseServerClientWithAuth()
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('DEBUG API balances - User:', user ? { id: user.id, email: user.email } : null)

    if (authError || !user) {
      console.log('DEBUG API balances - Pas d\'utilisateur authentifié')
      return NextResponse.json({ 
        success: false, 
        error: 'Non autorisé' 
      }, { status: 401 })
    }

    // Récupérer les groupes de l'utilisateur en deux étapes pour éviter les problèmes de jointure
    const { data: memberships, error: membershipsError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id)
      .is('left_at', null)

    console.log('DEBUG API balances - memberships:', memberships)
    console.log('DEBUG API balances - membershipsError:', membershipsError)

    if (membershipsError) {
      console.error('Erreur récupération memberships:', membershipsError)
      return NextResponse.json({ 
        success: false, 
        error: 'Erreur lors de la récupération des groupes' 
      }, { status: 500 })
    }

    const groupIds = memberships?.map((m: any) => m.group_id) || []
    console.log('DEBUG API balances - groupIds:', groupIds)

    // Si pas de groupes, retourner des valeurs par défaut
    if (groupIds.length === 0) {
      return NextResponse.json({ 
        success: true,
        data: {
          totalOwed: 0,
          totalYouOwe: 0,
          netBalance: 0,
          monthExpenses: 0,
          activeGroups: 0,
          pendingTransactions: 0,
          balancesByGroup: [],
          balancesByPerson: []
        }
      })
    }

    // Récupérer les détails des groupes
    console.log('DEBUG API balances - Tentative récupération groupes avec IDs:', groupIds)
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id, name, currency')
      .in('id', groupIds)

    console.log('DEBUG API balances - groups:', groups)
    console.log('DEBUG API balances - groupsError:', groupsError)

    if (groupsError) {
      console.error('Erreur récupération groupes:', groupsError)
      return NextResponse.json({ 
        success: false, 
        error: `Erreur lors de la récupération des groupes: ${groupsError.message}` 
      }, { status: 500 })
    }

    // Récupérer les dépenses du mois en cours pour ces groupes
    const currentMonth = new Date()
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    
    const { data: monthExpenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount, currency')
      .in('group_id', groupIds)
      .gte('expense_date', firstDayOfMonth.toISOString())

    if (expensesError) {
      console.error('Erreur récupération dépenses:', expensesError)
    }

    // Calculer les totaux des dépenses du mois
    const totalMonthExpenses = monthExpenses?.reduce((sum: number, expense: any) => sum + expense.amount, 0) || 0
    
    // CALCUL RÉEL DES BALANCES
    // Récupération des dépenses avec participants (fix pour relation problématique)
    let expenses: { id: string, group_id: string, amount: number, currency: string, description: string, created_by: string, paid_by: string, created_at: string, expense_participants: { id: string, expense_id: string, user_id: string, share_amount: number }[] }[] = []
    try {
      // D'abord récupérer les dépenses seules
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select(`
          id,
          group_id,
          amount,
          currency,
          description,
          created_by,
          paid_by,
          created_at
        `)
        .in('group_id', groupIds)

      if (expensesError) {
        console.error('Erreur récupération dépenses:', expensesError)
        expenses = []
      } else {
        console.log(`DEBUG API balances - Dépenses récupérées: ${expensesData?.length || 0}`)
        
        // Ensuite récupérer les participants séparément
        if (expensesData && expensesData.length > 0) {
          const expenseIds = expensesData.map(e => e.id)
          
          const { data: participantsData, error: participantsError } = await supabase
            .from('expense_participants')
            .select('id, expense_id, user_id, share_amount')
            .in('expense_id', expenseIds)

          if (participantsError) {
            console.warn('Impossible de récupérer les participants:', participantsError)
            // Continuer sans les participants
            expenses = expensesData.map(expense => ({
              ...expense,
              expense_participants: []
            }))
          } else {
            // Associer les participants aux dépenses
            expenses = expensesData.map(expense => ({
              ...expense,
              expense_participants: participantsData?.filter(p => p.expense_id === expense.id) || []
            }))
          }
        } else {
          expenses = []
        }
      }
    } catch (error) {
      console.error('Erreur récupération dépenses:', error)
      expenses = []
    }

    // Récupérer les paiements (avec gestion d'erreur pour colonne manquante)
    let payments: any[] = []
    try {
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .or(`payer_id.eq.${user.id},payee_id.eq.${user.id}`)

      if (paymentsError) {
        console.error('Erreur récupération paiements:', paymentsError)
        // Si la table payments n'existe pas ou a des problèmes, on continue sans
        payments = []
      } else {
        payments = paymentsData || []
      }
    } catch (error) {
      console.warn('Table payments indisponible, calcul sans paiements:', error)
      payments = []
    }

    // Calcul des balances par personne
    const userBalances = new Map<string, number>()
    const groupBalances = new Map<string, { name: string, balance: number }>()

    // Initialiser les balances de groupe
    groups?.forEach(group => {
      groupBalances.set(group.id, { name: group.name, balance: 0 })
    })

    console.log(`DEBUG API balances - Traitement de ${expenses?.length || 0} dépenses pour l'utilisateur ${user.id}`)

    // Traiter les dépenses (version améliorée)
    for (const expense of expenses || []) {
      const expenseCreator = expense.created_by || expense.paid_by
      
      // Récupérer les membres du groupe pour cette dépense
      const { data: groupMembers } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', expense.group_id)
        .is('left_at', null)
      
      const groupMembersCount = groupMembers?.length || 2
      const sharePerPerson = expense.amount / groupMembersCount
      
      console.log(`DEBUG - Dépense ${expense.id}: ${expense.amount}, créateur: ${expenseCreator}, partage: ${sharePerPerson}, membres: ${groupMembersCount}`)
      
      if (expense.expense_participants && expense.expense_participants.length > 0) {
        // Logique avec participants (si disponible)
        for (const participant of expense.expense_participants) {
          if (participant.user_id === user.id && expenseCreator !== user.id) {
            // L'utilisateur doit de l'argent au créateur
            const currentBalance = userBalances.get(expenseCreator) || 0
            userBalances.set(expenseCreator, currentBalance - (participant.share_amount || 0))
            console.log(`DEBUG - ${user.id} doit ${participant.share_amount} à ${expenseCreator}`)
          } else if (expenseCreator === user.id && participant.user_id !== user.id) {
            // Quelqu'un doit de l'argent à l'utilisateur
            const currentBalance = userBalances.get(participant.user_id) || 0
            userBalances.set(participant.user_id, currentBalance + (participant.share_amount || 0))
            console.log(`DEBUG - ${participant.user_id} doit ${participant.share_amount} à ${user.id}`)
          }
        }
      } else {
        // Logique simplifiée sans participants
        if (expenseCreator === user.id) {
          // L'utilisateur a payé pour le groupe - les autres lui doivent de l'argent
          const amountOwedToUser = expense.amount - sharePerPerson // Il ne se doit pas à lui-même
          
          // Pour simplifier, on crée une dette générique "groupe"
          const currentBalance = userBalances.get(expense.group_id) || 0
          userBalances.set(expense.group_id, currentBalance + amountOwedToUser)
          
          console.log(`DEBUG - L'utilisateur ${user.id} a payé ${expense.amount}, on lui doit ${amountOwedToUser}`)
          
        } else {
          // L'utilisateur doit sa part au créateur de la dépense
          const currentBalance = userBalances.get(expenseCreator) || 0
          userBalances.set(expenseCreator, currentBalance - sharePerPerson)
          
          console.log(`DEBUG - L'utilisateur ${user.id} doit ${sharePerPerson} à ${expenseCreator}`)
        }
      }
    }

    // Traiter les paiements pour ajuster les balances (uniquement si les colonnes existent)
    for (const payment of payments || []) {
      try {
        if (payment.payer_id === user.id && payment.recipient_id) {
          // L'utilisateur a payé quelqu'un - cela réduit sa dette
          const currentBalance = userBalances.get(payment.recipient_id) || 0
          userBalances.set(payment.recipient_id, currentBalance + payment.amount)
          console.log(`DEBUG - Paiement: ${user.id} a payé ${payment.amount} à ${payment.recipient_id}`)
        } else if (payment.recipient_id === user.id && payment.payer_id) {
          // Quelqu'un a payé l'utilisateur - cela réduit ce qu'on lui doit
          const currentBalance = userBalances.get(payment.payer_id) || 0
          userBalances.set(payment.payer_id, currentBalance - payment.amount)
          console.log(`DEBUG - Paiement reçu: ${payment.payer_id} a payé ${payment.amount} à ${user.id}`)
        }
      } catch (error) {
        console.log('DEBUG - Paiement ignoré (colonnes manquantes):', error)
      }
    }

    // Récupérer les informations des utilisateurs pour les balances
    const userIds = Array.from(userBalances.keys()).filter(id => !groupIds.includes(id))
    let userDetails: any[] = []
    
    if (userIds.length > 0) {
      try {
        console.log('DEBUG - Récupération infos utilisateurs pour IDs:', userIds)
        
        // Utiliser notre API dédiée pour récupérer les utilisateurs
        const userIdsParam = userIds.join(',')
        const usersResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/users?userIds=${userIdsParam}`, {
          headers: {
            'Cookie': request.headers.get('cookie') || ''
          }
        })
        
        if (usersResponse.ok) {
          const usersResult = await usersResponse.json()
          if (usersResult.success) {
            userDetails = usersResult.data
          }
        }
        
        console.log('DEBUG - User details récupérés via API:', userDetails.length)
        
      } catch (error) {
        console.error('Erreur récupération utilisateurs via API:', error)
      }
      
      // Si la récupération via API a échoué, créer des fallbacks
      if (userDetails.length === 0) {
        userIds.forEach(userId => {
          userDetails.push({
            id: userId,
            email: `user_${userId.substring(0, 8)}@buddybill.local`,
            full_name: `Utilisateur ${userId.substring(0, 8)}`,
            name: `User_${userId.substring(0, 8)}`,
            avatar_url: null
          })
        })
      }
    }

    // Calculer les totaux
    let totalOwed = 0 // Ce qui vous est dû (positif)
    let totalYouOwe = 0 // Ce que vous devez (positif)

    console.log('DEBUG - Balances finales:', Object.fromEntries(userBalances.entries()))

    const balancesByPerson = Array.from(userBalances.entries())
      .map(([userId, balance]) => {
        // Trouver les détails de l'utilisateur
        const userDetail = userDetails.find(u => u.id === userId)
        const name = userDetail?.full_name || userDetail?.name || userDetail?.email?.split('@')[0] || 'Utilisateur'
        const email = userDetail?.email || ''
        
        if (balance > 0) {
          totalOwed += balance
          return {
            userId,
            name,
            email,
            amount: balance,
            balance,
            type: 'owed_to_you' as const
          }
        } else if (balance < 0) {
          totalYouOwe += Math.abs(balance)
          return {
            userId,
            name,
            email,
            amount: Math.abs(balance),
            balance,
            type: 'you_owe' as const
          }
        }
        return null
      })
      .filter(Boolean)

    console.log(`DEBUG - Total dû à vous: ${totalOwed}, Total que vous devez: ${totalYouOwe}`)

    const netBalance = totalOwed - totalYouOwe

    const balancesByGroup = Array.from(groupBalances.entries()).map(([groupId, data]) => ({
      groupId,
      groupName: data.name,
      balance: data.balance,
      owedToYou: data.balance > 0 ? data.balance : 0,
      youOwe: data.balance < 0 ? Math.abs(data.balance) : 0
    }))

    return NextResponse.json({
      success: true,
      data: {
        totalOwed,
        totalYouOwe,
        netBalance,
        monthExpenses: totalMonthExpenses,
        activeGroups: groups?.length || 0,
        pendingTransactions: balancesByPerson.length,
        balancesByGroup,
        balancesByPerson
      }
    })

  } catch (error) {
    console.error('Erreur API balances:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 })
  }
}
