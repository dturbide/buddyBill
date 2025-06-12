import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClientWithAuth } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClientWithAuth()
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false,
        error: 'Non autorisé' 
      }, { status: 401 })
    }

    const { 
      groupId, 
      payerId, 
      payeeId, 
      amount, 
      currency,
      description,
      paymentDate 
    } = await request.json()

    // Validation des données
    if (!payerId || !payeeId || !amount) {
      return NextResponse.json({
        success: false,
        error: 'Données manquantes: payerId, payeeId et amount requis'
      }, { status: 400 })
    }

    if (payerId === payeeId) {
      return NextResponse.json({
        success: false,
        error: 'Le payeur et le bénéficiaire ne peuvent pas être la même personne'
      }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Le montant doit être positif'
      }, { status: 400 })
    }

    // Vérifier que l'utilisateur peut créer ce paiement
    // (soit il est le payeur, soit il est admin du groupe)
    if (payerId !== user.id) {
      // Vérifier si l'utilisateur est admin du groupe
      if (groupId) {
        const { data: membership, error: membershipError } = await supabase
          .from('group_members')
          .select('role')
          .eq('group_id', groupId)
          .eq('user_id', user.id)
          .single()

        if (membershipError || !membership || membership.role !== 'admin') {
          return NextResponse.json({
            success: false,
            error: 'Vous ne pouvez enregistrer que vos propres paiements ou être admin du groupe'
          }, { status: 403 })
        }
      } else {
        return NextResponse.json({
          success: false,
          error: 'Vous ne pouvez enregistrer que vos propres paiements'
        }, { status: 403 })
      }
    }

    // Créer le paiement
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        group_id: groupId,
        payer_id: payerId,
        payee_id: payeeId,
        amount: parseFloat(amount),
        currency: currency || 'EUR',
        description: description || null,
        status: 'completed', // Les paiements sont directement marqués comme complétés
        payment_date: paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString()
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Erreur création paiement:', paymentError)
      return NextResponse.json({
        success: false,
        error: `Erreur lors de l'enregistrement du paiement: ${paymentError.message}`
      }, { status: 500 })
    }

    // Optionnel: Récupérer les noms des utilisateurs pour la réponse
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, full_name')
      .in('id', [payerId, payeeId])

    if (usersError) {
      console.error('Erreur récupération noms utilisateurs:', usersError)
    }

    const usersMap = new Map(users?.map((u: any) => [u.id, u.full_name]) || [])

    return NextResponse.json({
      success: true,
      data: {
        payment,
        payerName: usersMap.get(payerId) || 'Utilisateur inconnu',
        payeeName: usersMap.get(payeeId) || 'Utilisateur inconnu'
      },
      message: 'Paiement enregistré avec succès'
    })

  } catch (error) {
    console.error('Erreur API payments:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 })
  }
}

// GET pour récupérer l'historique des paiements
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClientWithAuth()
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false,
        error: 'Non autorisé' 
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Essayer d'abord avec la requête complexe
    try {
      let query = supabase
        .from('payments')
        .select(`
          *,
          payer:user_profiles!payments_payer_id_fkey(id, full_name),
          payee:user_profiles!payments_payee_id_fkey(id, full_name)
        `)
        .or(`payer_id.eq.${user.id},payee_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (groupId) {
        query = query.eq('group_id', groupId)
      }

      const { data: payments, error: paymentsError } = await query

      if (paymentsError) {
        throw paymentsError
      }

      return NextResponse.json({
        success: true,
        data: payments || []
      })

    } catch (relationError) {
      console.log('Erreur avec relations, tentative requête simple:', relationError)
      
      // Fallback: requête simple sans relations
      let simpleQuery = supabase
        .from('payments')
        .select('*')
        .or(`payer_id.eq.${user.id},payee_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (groupId) {
        simpleQuery = simpleQuery.eq('group_id', groupId)
      }

      const { data: simplePayments, error: simpleError } = await simpleQuery

      if (simpleError) {
        throw simpleError
      }

      // Récupérer les noms d'utilisateurs séparément
      const userIds = new Set<string>()
      simplePayments?.forEach((payment: any) => {
        if (payment.payer_id) userIds.add(payment.payer_id)
        if (payment.payee_id) userIds.add(payment.payee_id)
      })

      let usersMap = new Map<string, string>()
      
      if (userIds.size > 0) {
        try {
          const { data: users, error: usersError } = await supabase
            .from('user_profiles')
            .select('id, full_name')
            .in('id', Array.from(userIds))

          if (!usersError && users) {
            usersMap = new Map(users.map((u: any) => [u.id, u.full_name || 'Utilisateur']))
          }
        } catch (usersError) {
          console.log('Impossible de récupérer les noms utilisateurs:', usersError)
        }
      }

      // Enrichir les paiements avec les noms
      const enrichedPayments = simplePayments?.map((payment: any) => ({
        ...payment,
        payer: { 
          id: payment.payer_id, 
          full_name: usersMap.get(payment.payer_id) || 'Utilisateur inconnu' 
        },
        payee: { 
          id: payment.payee_id, 
          full_name: usersMap.get(payment.payee_id) || 'Utilisateur inconnu' 
        }
      })) || []

      return NextResponse.json({
        success: true,
        data: enrichedPayments
      })
    }

  } catch (error) {
    console.error('Erreur API payments GET:', error)
    
    // Si même la table payments n'existe pas, retourner une liste vide
    if (error instanceof Error && error.message.includes('does not exist')) {
      console.log('Table payments inexistante, retour liste vide')
      return NextResponse.json({
        success: true,
        data: [],
        warning: 'Table payments non configurée - aucun historique disponible'
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération des paiements'
    }, { status: 500 })
  }
}
