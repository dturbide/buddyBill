import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClientWithAuth } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { inviteCode } = await request.json()
    const supabase = await getSupabaseServerClientWithAuth()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non connecté' },
        { status: 401 }
      )
    }

    // Valider le code d'invitation
    if (!inviteCode || typeof inviteCode !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Code d\'invitation requis' },
        { status: 400 }
      )
    }

    const cleanInviteCode = inviteCode.toUpperCase().trim()
    console.log("DEBUG Join: Code recherché:", cleanInviteCode)

    // Chercher le groupe par code d'invitation
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('id, name, invite_code')
      .eq('invite_code', cleanInviteCode)
      .single()

    console.log("DEBUG Join: Résultat recherche groupe:", { group, groupError })

    if (groupError || !group) {
      console.error('Groupe non trouvé:', groupError)
      return NextResponse.json(
        { success: false, error: 'Code d\'invitation invalide' },
        { status: 400 }
      )
    }

    // Vérifier si l'utilisateur est déjà membre
    const { data: existingMember, error: memberError } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', user.id)
      .is('left_at', null)
      .single()

    if (existingMember) {
      return NextResponse.json(
        { success: false, error: 'Vous êtes déjà membre de ce groupe' },
        { status: 400 }
      )
    }

    // Ajouter l'utilisateur au groupe
    const { error: insertError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: 'member'
      })

    if (insertError) {
      console.error('Erreur insertion member:', insertError)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de l\'ajout au groupe' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Vous avez rejoint le groupe "${group.name}" avec succès !`,
      groupId: group.id,
      groupName: group.name
    })

  } catch (error) {
    console.error('Erreur dans l\'API join group:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}
