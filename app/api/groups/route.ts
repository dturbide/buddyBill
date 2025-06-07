import { getSupabaseServerClientWithAuth } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🏠 DEBUG API groups - Début de la requête')
    const supabase = await getSupabaseServerClientWithAuth()
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('🏠 DEBUG API groups - User:', user ? { id: user.id, email: user.email } : null)
    
    if (authError || !user) {
      console.log('🏠 DEBUG API groups - Pas d\'utilisateur authentifié')
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    console.log('🏠 DEBUG API groups - Récupération des memberships pour user:', user.id)
    
    // Étape 1: Récupérer les memberships sans jointure complexe
    const { data: memberships, error: membershipsError } = await supabase
      .from('group_members')
      .select('group_id, role')
      .eq('user_id', user.id)
      .is('left_at', null)

    console.log('🏠 DEBUG API groups - Memberships:', memberships?.length || 0)
    console.log('🏠 DEBUG API groups - Memberships error:', membershipsError)

    if (membershipsError) {
      console.error('🏠 DEBUG API groups - Erreur récupération memberships:', membershipsError)
      return NextResponse.json({ 
        success: false,
        error: 'Erreur interne' 
      }, { status: 500 })
    }

    if (!memberships || memberships.length === 0) {
      console.log('🏠 DEBUG API groups - Aucun membership trouvé')
      return NextResponse.json({ 
        success: true,
        data: [] 
      })
    }

    // Étape 2: Récupérer les détails des groupes séparément
    const groupIds = memberships.map(m => m.group_id)
    console.log('🏠 DEBUG API groups - Group IDs:', groupIds)
    
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id, name, description, created_by, created_at, default_currency')
      .in('id', groupIds)

    console.log('🏠 DEBUG API groups - Groups:', groups?.length || 0)
    console.log('🏠 DEBUG API groups - Groups error:', groupsError)

    if (groupsError) {
      console.error('🏠 DEBUG API groups - Erreur récupération groupes:', groupsError)
      return NextResponse.json({ 
        success: false,
        error: 'Erreur récupération groupes' 
      }, { status: 500 })
    }

    // Étape 3: Pour chaque groupe, construire l'objet final
    const groupsWithDetails = groups?.map(group => {
      const membership = memberships.find(m => m.group_id === group.id)
      
      return {
        id: group.id,
        name: group.name,
        description: group.description,
        created_by: group.created_by,
        created_at: group.created_at,
        defaultCurrency: group.default_currency || 'EUR', 
        currency: group.default_currency || 'EUR', 
        members: [], // Simplifié pour éviter les erreurs
        userRole: membership?.role || 'member'
      }
    }) || []

    console.log("🏠 DEBUG API groups - Groupes finaux:", groupsWithDetails.length)

    return NextResponse.json({ 
      success: true,
      data: groupsWithDetails 
    })

  } catch (error) {
    console.error('🏠 DEBUG API groups - Erreur API groupes:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur serveur interne' 
    }, { status: 500 })
  }
}
