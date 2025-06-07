import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClientWithAuth } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('🗑️ DEBUG DELETE - Début suppression groupe')
    const supabase = await getSupabaseServerClientWithAuth()
    
    // Vérifier l'authentification avec le client normal
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('🗑️ DEBUG DELETE - User:', user ? { id: user.id, email: user.email } : null)
    
    if (authError || !user) {
      console.log('🗑️ DEBUG DELETE - Pas d\'utilisateur authentifié')
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { groupId } = await request.json()
    console.log('🗑️ DEBUG DELETE - Group ID:', groupId)

    if (!groupId) {
      console.log('🗑️ DEBUG DELETE - Pas de Group ID fourni')
      return NextResponse.json(
        { success: false, error: 'Group ID requis' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur est admin du groupe avec le client normal
    const { data: membership, error: membershipError } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .is('left_at', null)
      .single()

    console.log('🗑️ DEBUG DELETE - Membership:', membership)
    console.log('🗑️ DEBUG DELETE - Membership error:', membershipError)

    if (membershipError || !membership) {
      console.log('🗑️ DEBUG DELETE - Utilisateur pas admin du groupe')
      return NextResponse.json(
        { success: false, error: 'Seuls les administrateurs peuvent supprimer un groupe' },
        { status: 403 }
      )
    }

    // Vérifier la disponibilité de la clé service role
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    console.log('🗑️ DEBUG DELETE - Service role key disponible:', !!serviceRoleKey)
    
    if (!serviceRoleKey) {
      console.log('🗑️ DEBUG DELETE - ERREUR: Clé service role manquante')
      return NextResponse.json(
        { success: false, error: 'Configuration serveur manquante' },
        { status: 500 }
      )
    }

    // TEMPORAIRE: Utiliser le service role pour contourner RLS
    console.log('🗑️ DEBUG DELETE - Utilisation du service role pour contourner RLS')
    const serviceRoleSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Étape 1: Supprimer les participants aux dépenses du groupe
    console.log('🗑️ DEBUG DELETE - Suppression des participants aux dépenses')
    
    // D'abord récupérer les IDs des dépenses du groupe
    const { data: expenseIds } = await serviceRoleSupabase
      .from('expenses')
      .select('id')
      .eq('group_id', groupId)
    
    console.log('🗑️ DEBUG DELETE - Dépenses trouvées:', expenseIds?.length || 0)
    
    let participantsDeleteError = null
    if (expenseIds && expenseIds.length > 0) {
      const { error } = await serviceRoleSupabase
        .from('expense_participants')
        .delete()
        .in('expense_id', expenseIds.map(e => e.id))
      participantsDeleteError = error
    }

    if (participantsDeleteError) {
      console.log('🗑️ DEBUG DELETE - Erreur suppression participants (ou table inexistante):', participantsDeleteError)
    }

    // Étape 2: Supprimer les dépenses du groupe
    console.log('🗑️ DEBUG DELETE - Suppression des dépenses du groupe')
    
    const { error: expensesDeleteError } = await serviceRoleSupabase
      .from('expenses')
      .delete()
      .eq('group_id', groupId)

    if (expensesDeleteError) {
      console.log('🗑️ DEBUG DELETE - Erreur suppression dépenses (ou table inexistante):', expensesDeleteError)
    }

    // Étape 3: Supprimer les paiements du groupe
    console.log('🗑️ DEBUG DELETE - Suppression des paiements du groupe')
    
    const { error: paymentsDeleteError } = await serviceRoleSupabase
      .from('payments')
      .delete()
      .eq('group_id', groupId)

    if (paymentsDeleteError) {
      console.log('🗑️ DEBUG DELETE - Erreur suppression paiements (ou table inexistante):', paymentsDeleteError)
    }

    // Étape 4: Supprimer tous les membres du groupe
    console.log('🗑️ DEBUG DELETE - Suppression des membres du groupe')
    const { data: deletedMembers, error: membersDeleteError } = await serviceRoleSupabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .select()

    console.log('🗑️ DEBUG DELETE - Membres supprimés:', deletedMembers?.length || 0)
    if (membersDeleteError) {
      console.error('🗑️ DEBUG DELETE - Erreur suppression membres:', membersDeleteError)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la suppression des membres du groupe' },
        { status: 500 }
      )
    }

    // Étape 5: Supprimer le groupe
    console.log('🗑️ DEBUG DELETE - Suppression du groupe')
    const { data: deletedGroup, error: deleteError } = await serviceRoleSupabase
      .from('groups')
      .delete()
      .eq('id', groupId)
      .select()

    console.log('🗑️ DEBUG DELETE - Groupe supprimé:', deletedGroup?.length || 0, 'lignes')
    if (deleteError) {
      console.error('🗑️ DEBUG DELETE - Erreur suppression groupe:', deleteError)
      return NextResponse.json(
        { success: false, error: `Erreur lors de la suppression du groupe: ${deleteError.message}` },
        { status: 500 }
      )
    }

    // Vérifier si le groupe a réellement été supprimé
    if (!deletedGroup || deletedGroup.length === 0) {
      console.error('🗑️ DEBUG DELETE - PROBLÈME: Aucun groupe supprimé')
      return NextResponse.json(
        { success: false, error: 'Le groupe n\'a pas pu être supprimé.' },
        { status: 500 }
      )
    }

    console.log('🗑️ DEBUG DELETE - Groupe et toutes ses données supprimés avec succès')
    return NextResponse.json({
      success: true,
      message: 'Groupe et toutes ses données supprimés définitivement'
    })

  } catch (error: any) {
    console.error('🗑️ DEBUG DELETE - Erreur inattendue:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur inattendue s\'est produite' },
      { status: 500 }
    )
  }
}
