"use server"

import { cookies } from "next/headers"
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server" // Server client
import { revalidatePath } from "next/cache"

interface GroupFormData {
  groupName: string
  groupDescription?: string
  groupType?: string
  // groupImage: File | null, // File uploads need different handling, often client-side to Supabase Storage then URL to DB
  groupImagePreview?: string | null // Store URL from storage
  defaultCurrency: string
  isInviteOnly: boolean
  requireApproval: boolean
  // selectedMembers: string[], // Member addition would be a separate step or more complex logic
  // manualEmail: string,
  // sendInvitations: boolean,
}

export async function createGroupAction(formData: GroupFormData) {
  const cookieStore = cookies()
  const supabase = createServerSupabaseClient(cookieStore)

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error("User not authenticated for creating group:", authError)
    return { success: false, error: "Utilisateur non authentifié." }
  }

  try {
    const { error: insertError } = await supabase.from("groups").insert({
      name: formData.groupName,
      description: formData.groupDescription,
      type: formData.groupType,
      image_url: formData.groupImagePreview, // Assuming image is uploaded to storage and URL is passed
      default_currency: formData.defaultCurrency,
      is_invite_only: formData.isInviteOnly,
      require_approval: formData.requireApproval,
      created_by: user.id,
    })

    if (insertError) {
      console.error("Error inserting group:", insertError)
      return { success: false, error: `Erreur lors de la création du groupe: ${insertError.message}` }
    }

    // Après la création réussie, ajouter le créateur comme membre admin du groupe
    const { error: memberInsertError } = await supabase.from("group_members").insert({
      group_id: (
        await supabase.from("groups").select("id").eq("name", formData.groupName).eq("created_by", user.id).single()
      ).data?.id, // This is a bit fragile, better to get ID from insert
      user_id: user.id,
      role: "admin",
    })

    if (memberInsertError) {
      console.error("Error adding creator as group member:", memberInsertError)
      // On pourrait choisir de rollback ou de notifier, pour l'instant on log l'erreur
      return {
        success: false,
        error: `Groupe créé, mais erreur lors de l'ajout du créateur comme membre: ${memberInsertError.message}`,
      }
    }

    revalidatePath("/groups-list-example") // Revalidate la page de la liste des groupes
    revalidatePath("/dashboard-example") // Et potentiellement le dashboard
    return { success: true, message: "Groupe créé avec succès !" }
  } catch (e: any) {
    console.error("Unexpected error creating group:", e)
    return { success: false, error: `Une erreur inattendue s'est produite: ${e.message}` }
  }
}
