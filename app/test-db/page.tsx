import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

export default async function TestDBPage() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  // Test 1: Vérifier l'utilisateur authentifié
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  // Test 2: Lister les tables disponibles
  let tablesInfo = null
  let groupsData = null
  let errorInfo = null
  
  try {
    // Essayer de récupérer des données de la table groups
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .limit(5)
      
    if (error) {
      errorInfo = error
    } else {
      groupsData = data
    }
  } catch (e: any) {
    errorInfo = { message: e.message, stack: e.stack }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test de connexion à la base de données</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Utilisateur authentifié:</h2>
          <pre className="text-sm overflow-auto">
            {user ? JSON.stringify(user, null, 2) : "Aucun utilisateur authentifié"}
          </pre>
          {authError && (
            <div className="text-red-600 mt-2">
              Erreur auth: {authError.message}
            </div>
          )}
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Test de la table groups:</h2>
          {errorInfo ? (
            <div className="text-red-600">
              <p>Erreur: {JSON.stringify(errorInfo, null, 2)}</p>
            </div>
          ) : (
            <pre className="text-sm overflow-auto">
              {JSON.stringify(groupsData, null, 2)}
            </pre>
          )}
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Variables d'environnement:</h2>
          <p>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Défini" : "✗ Manquant"}</p>
          <p>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓ Défini" : "✗ Manquant"}</p>
        </div>
      </div>
    </div>
  )
}
