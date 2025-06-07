import { createClient } from '@/lib/supabase/client'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function getCurrentUser() {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    return user
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error)
    return null
  }
}

export async function getCurrentUserServer() {
  try {
    const supabase = getSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    return user
  } catch (error) {
    console.error('Erreur récupération utilisateur serveur:', error)
    return null
  }
}

export async function requireAuth() {
  const user = await getCurrentUserServer()
  
  if (!user) {
    throw new Error('Non autorisé - utilisateur non connecté')
  }
  
  return user
}
