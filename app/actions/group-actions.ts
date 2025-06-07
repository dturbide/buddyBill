"use server"

import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface GroupFormData {
  groupName: string
  groupDescription?: string
  groupType?: string
  groupImagePreview?: string | null
  defaultCurrency: string
  isInviteOnly: boolean
  requireApproval: boolean
}

export async function createGroupAction(formData: GroupFormData) {
  try {
    console.log("Starting createGroupAction with data:", formData)
    
    // Obtenir le cookie store
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("User not authenticated for creating group:", authError)
      return { success: false, error: "Utilisateur non authentifié." }
    }

    console.log("Authenticated user:", user.id)

    // Créer le groupe - utiliser le nom de table avec le schéma
    const { data: newGroup, error: insertError } = await supabase
      .from("groups") // Supabase utilisera automatiquement le bon schéma via RLS
      .insert({
        name: formData.groupName,
        description: formData.groupDescription || null,
        image_url: formData.groupImagePreview || null,
        currency: formData.defaultCurrency, // Pas besoin de cast
        created_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error("Detailed error inserting group:", {
        error: insertError,
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      })
      return { 
        success: false, 
        error: `Erreur lors de la création du groupe: ${insertError.message || insertError.code || 'Erreur inconnue'}` 
      }
    }

    if (!newGroup) {
      console.error("No group data returned after insert")
      return { success: false, error: "Erreur lors de la création du groupe: aucune donnée retournée" }
    }

    console.log("Group created successfully:", newGroup.id)

    // Ajouter le créateur comme membre admin du groupe
    const { error: memberInsertError } = await supabase
      .from("group_members")
      .insert({
        group_id: newGroup.id,
        user_id: user.id,
        role: "admin",
        invited_by: user.id,
      })

    if (memberInsertError) {
      console.error("Detailed error adding creator as group member:", {
        error: memberInsertError,
        code: memberInsertError.code,
        message: memberInsertError.message,
        details: memberInsertError.details,
        hint: memberInsertError.hint
      })
      // On pourrait faire un rollback ici
      return {
        success: false,
        error: `Groupe créé, mais erreur lors de l'ajout du créateur comme membre: ${memberInsertError.message || memberInsertError.code || 'Erreur inconnue'}`,
      }
    }

    console.log("Member added successfully")

    // Revalider les pages qui affichent les groupes
    revalidatePath("/dashboard/groups")
    revalidatePath("/dashboard")
    
    return { success: true, message: "Groupe créé avec succès !" }
  } catch (e: any) {
    console.error("Unexpected error in createGroupAction:", e)
    return { 
      success: false, 
      error: `Une erreur inattendue s'est produite: ${e?.message || e?.toString() || "Erreur inconnue"}` 
    }
  }
}
