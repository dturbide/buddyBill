import { getSupabaseServerClientWithAuth } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await getSupabaseServerClientWithAuth()
    
    // Récupérer l'utilisateur authentifié
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer le profil utilisateur pour avoir des infos complètes
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, full_name, role, preferred_currency')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Erreur récupération profil:', profileError)
      // Retourner quand même les infos de base si le profil n'existe pas
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || 'Utilisateur',
          tenant_id: null,
          role: 'user',
          preferred_currency: 'USD'
        }
      })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: profile.full_name || user.user_metadata?.full_name || 'Utilisateur',
        tenant_id: null, // Temporaire jusqu'à migration complète
        role: profile.role || 'user', // Maintenant récupéré depuis la DB
        preferred_currency: profile.preferred_currency || 'USD'
      }
    })

  } catch (error) {
    console.error('Erreur API user:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
