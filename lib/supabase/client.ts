import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  // Remplacez par vos variables d'environnement réelles en production
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase URL or Anon Key is missing. Using dummy client. Functionality will be limited.")
    // Fallback à un client factice si les variables ne sont pas définies
    // Cela permet à l'UI de ne pas planter, mais les appels Supabase ne fonctionneront pas.
    return {
      auth: {
        signUp: async () => ({
          data: { user: null, session: null },
          error: { message: "Dummy client: Supabase not configured." },
        }),
        signInWithPassword: async () => ({
          data: { user: null, session: null },
          error: { message: "Dummy client: Supabase not configured." },
        }),
        resetPasswordForEmail: async () => ({ data: {}, error: { message: "Dummy client: Supabase not configured." } }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        getUser: async () => ({
          data: { user: null },
          error: null, // No error object for dummy getUser when Supabase is not configured
        }), // Added dummy getUser
        // Ajoutez d'autres méthodes factices si nécessaire
      },
      from: (table: string) => ({
        insert: async (data: any) => ({ data: [data], error: { message: "Dummy client: Supabase not configured." } }),
        select: async () => ({ data: [], error: { message: "Dummy client: Supabase not configured." } }),
        // Ajoutez d'autres méthodes factices de manipulation de données si nécessaire
      }),
      // ... autres services Supabase que vous pourriez utiliser
    } as any // Utilisez 'as any' pour le client factice pour éviter les erreurs de type strictes
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
