import { getSupabaseServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()
    
    const { data: categories, error } = await supabase
      .from('expense_categories')
      .select('*')
      .order('name')

    if (error) {
      console.error('Erreur récupération catégories:', error)
      // Retourner des catégories par défaut
      const defaultCategories = [
        { id: '1', name: 'Alimentation', icon: '🍕' },
        { id: '2', name: 'Transport', icon: '🚗' },
        { id: '3', name: 'Divertissement', icon: '🎬' },
        { id: '4', name: 'Logement', icon: '🏠' },
        { id: '5', name: 'Autre', icon: '💰' }
      ]
      
      return NextResponse.json({ 
        success: true, 
        data: defaultCategories 
      })
    }

    return NextResponse.json({ 
      success: true, 
      data: categories || [] 
    })

  } catch (error) {
    console.error('Erreur API catégories:', error)
    
    // En cas d'erreur, retourner des catégories par défaut
    const defaultCategories = [
      { id: '1', name: 'Alimentation', icon: '🍕' },
      { id: '2', name: 'Transport', icon: '🚗' },
      { id: '3', name: 'Divertissement', icon: '🎬' },
      { id: '4', name: 'Logement', icon: '🏠' },
      { id: '5', name: 'Autre', icon: '💰' }
    ]
    
    return NextResponse.json({ 
      success: true, 
      data: defaultCategories 
    })
  }
}
