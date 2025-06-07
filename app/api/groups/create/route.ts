import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClientWithAuth } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json()

    console.log("=== API Route: Création de groupe ===")
    console.log("Données reçues:", JSON.stringify(formData, null, 2))

    const supabase = await getSupabaseServerClientWithAuth()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error("User not authenticated:", authError)
      return NextResponse.json(
        { success: false, error: "Utilisateur non authentifié" },
        { status: 401 }
      )
    }

    console.log("Utilisateur:", user.id, user.email)

    // Générer un code d'invitation unique
    const generateInviteCode = () => {
      return Math.random().toString(36).substring(2, 8).toUpperCase()
    }

    const inviteCode = generateInviteCode()
    console.log("DEBUG Create: Code d'invitation généré:", inviteCode)

    // Créer le groupe
    console.log("DEBUG: Tentative d'insertion avec les données:", {
      name: formData.groupName,
      description: formData.groupDescription || null,
      image_url: formData.groupImagePreview || null,
      default_currency: formData.defaultCurrency,
      invite_code: inviteCode,
      created_by: user.id,
    })

    const { data: newGroup, error: insertError } = await supabase
      .from("groups")
      .insert({
        name: formData.groupName,
        description: formData.groupDescription || null,
        default_currency: formData.defaultCurrency,
        invite_code: inviteCode,
        created_by: user.id,
      })
      .select()
      .single()

    console.log("Résultat insertion groupe:", { newGroup, insertError })

    if (insertError) {
      console.error("Error inserting group:", insertError)
      return NextResponse.json(
        { 
          success: false, 
          error: `Erreur lors de la création du groupe: ${insertError.message || insertError.code || 'Erreur inconnue'}` 
        },
        { status: 400 }
      )
    }

    if (!newGroup) {
      return NextResponse.json(
        { success: false, error: "Erreur lors de la création du groupe: aucune donnée retournée" },
        { status: 400 }
      )
    }

    // Ajouter l'utilisateur créateur comme admin du groupe
    const { error: memberError } = await supabase
      .from("group_members")
      .insert({
        group_id: newGroup.id,
        user_id: user.id,
        role: "admin"
      })

    console.log("Résultat ajout membre:", { memberError })

    if (memberError) {
      console.error("Error adding user to group:", memberError)
      // Note: On ne supprime pas le groupe car il peut être récupéré
      return NextResponse.json(
        { 
          success: false, 
          error: `Le groupe a été créé mais impossible de vous ajouter comme membre: ${memberError.message}` 
        },
        { status: 400 }
      )
    }

    console.log("Groupe créé avec succès:", newGroup.id, newGroup.name)
    
    return NextResponse.json({
      success: true,
      message: `Groupe "${formData.groupName}" créé avec succès !`,
      groupId: newGroup.id,
      inviteCode: inviteCode,
    })

  } catch (e: any) {
    console.error("Unexpected error:", e)
    return NextResponse.json(
      { 
        success: false, 
        error: `Une erreur inattendue s'est produite: ${e?.message || e?.toString() || "Erreur inconnue"}` 
      },
      { status: 500 }
    )
  }
}
