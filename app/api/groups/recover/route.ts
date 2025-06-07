import { getSupabaseServerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { groupId } = await request.json()

    if (!groupId) {
      return NextResponse.json(
        { error: 'ID du groupe requis' },
        { status: 400 }
      )
    }

    // Vérifier que le groupe est supprimé et récupérable
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('id, name, deleted_at, recover_until')
      .eq('id', groupId)
      .not('deleted_at', 'is', null)
      .single()

    if (groupError || !group) {
      return NextResponse.json(
        { error: 'Groupe supprimé non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier que la période de récupération n'est pas expirée
    const now = new Date()
    const recoverUntil = new Date(group.recover_until)
    
    if (now > recoverUntil) {
      return NextResponse.json(
        { error: 'Période de récupération expirée (30 jours)' },
        { status: 410 }
      )
    }

    // Vérifier que l'utilisateur était membre du groupe
    const { data: membership, error: membershipError } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Non autorisé à récupérer ce groupe' },
        { status: 403 }
      )
    }

    // Récupérer le groupe (supprimer les marqueurs de suppression)
    const { error: recoverError } = await supabase
      .from('groups')
      .update({
        deleted_at: null,
        recover_until: null
      })
      .eq('id', groupId)

    if (recoverError) {
      console.error('Erreur récupération groupe:', recoverError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération du groupe' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Groupe "${group.name}" récupéré avec succès`,
      group: {
        id: group.id,
        name: group.name
      }
    })

  } catch (error) {
    console.error('Erreur récupération groupe:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// API pour lister les groupes supprimés récupérables
export async function GET() {
  try {
    const supabase = getSupabaseServerClient()
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer les groupes supprimés récupérables de l'utilisateur
    const { data: memberships, error: membershipsError } = await supabase
      .from('group_members')
      .select('group_id, role')
      .eq('user_id', user.id)

    if (membershipsError || !memberships) {
      return NextResponse.json({ deletedGroups: [] })
    }

    const groupIds = memberships.map(m => m.group_id)
    const now = new Date().toISOString()

    const { data: deletedGroups, error: groupsError } = await supabase
      .from('groups')
      .select('id, name, deleted_at, recover_until')
      .in('id', groupIds)
      .not('deleted_at', 'is', null)
      .gt('recover_until', now) // Seulement les récupérables (non expirés)

    if (groupsError) {
      console.error('Erreur récupération groupes supprimés:', groupsError)
      return NextResponse.json({ deletedGroups: [] })
    }

    return NextResponse.json({ 
      deletedGroups: deletedGroups || [],
      count: deletedGroups?.length || 0
    })

  } catch (error) {
    console.error('Erreur liste groupes supprimés:', error)
    return NextResponse.json({ deletedGroups: [] })
  }
}
