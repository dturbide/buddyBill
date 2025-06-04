import UserProfileScreen from "@/components/user-profile-screen"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-slate-100 p-4 space-y-8">
      <nav className="flex flex-wrap justify-center space-x-4">
        <Link href="/welcome-example" className="text-blue-500 hover:underline">
          Voir Exemple Accueil/Onboarding
        </Link>
        <Link href="/registration-example" className="text-blue-500 hover:underline">
          S'inscrire (avec Supabase)
        </Link>
        <Link href="/login-example" className="text-blue-500 hover:underline">
          Se Connecter (avec Supabase)
        </Link>
        <Link href="/user-profile-example" className="text-blue-500 hover:underline">
          Voir Profil Utilisateur (avec Supabase)
        </Link>
        <Link href="/dashboard-example" className="text-blue-500 hover:underline">
          Voir Tableau de Bord
        </Link>
        <Link href="/groups-list-example" className="text-blue-500 hover:underline">
          Voir Liste des Groupes
        </Link>
        <Link href="/create-group-example" className="text-blue-500 hover:underline">
          Créer un Groupe (avec Supabase)
        </Link>
        {/* ... autres liens ... */}
      </nav>
      <p className="text-center">
        Le flux d'authentification et la création de groupe sont maintenant connectés (simulés) à Supabase. Essayez de
        vous inscrire ou de créer un groupe.
        <br />
        Affichage de l'écran Profil Utilisateur par défaut (qui tentera de charger les données utilisateur) :
      </p>
      <UserProfileScreen />
    </div>
  )
}
