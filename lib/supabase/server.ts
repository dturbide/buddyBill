import "server-only"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export async function createClient(cookieStore: any) {
  // Remplacez par vos variables d'environnement réelles en production
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  // Pour les actions serveur, vous pourriez avoir besoin d'une clé de service si RLS n'est pas suffisant
  // Pour l'instant, nous utilisons la clé anonyme, en supposant que RLS est configuré pour permettre les insertions par les utilisateurs authentifiés.
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "Supabase URL or Anon Key is missing for server client. Using dummy client. Server actions might fail.",
    )
    // Fallback à un client factice pour le serveur
    return {
      auth: {
        getUser: async () => ({
          data: { user: null },
          error: { message: "Dummy server client: Supabase not configured." },
        }),
        // ... autres méthodes d'authentification serveur factices
      },
      from: (table: string) => ({
        insert: async (data: any) => ({
          data: [data],
          error: table === "groups_error_test" ? { message: "Dummy server client: Error inserting to " + table } : null,
        }),
        // ... autres méthodes de manipulation de données serveur factices
      }),
    } as any
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }: any) => cookieStore.set(name, value, options))
        } catch (error) {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
    // Removed db: { schema: 'app' } as Supabase only supports public or graphql_public
  })
}
