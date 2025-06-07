"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  User,
  Bell,
  ShieldCheck,
  HelpCircle,
  LogOut,
  ChevronRight,
  Edit3,
  Mail,
  Phone,
  DollarSign,
  CalendarDays,
  AlertCircle,
  Hourglass,
  Fingerprint,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react" // Added for user state
import { useBiometricAuth } from "@/hooks/use-biometric-auth"

interface UserData {
  id: string
  name: string
  email: string
  avatarUrl?: string
  phone?: string
  defaultCurrency?: string
  memberSince?: string // ISO string
}

interface ProfileLinkItemProps {
  icon: React.ElementType
  label: string
  href?: string
  onClick?: () => void
  value?: string
}

const ProfileLinkItem: React.FC<ProfileLinkItemProps> = ({ icon: Icon, label, href, onClick, value }) => {
  const content = (
    <div className="flex items-center justify-between w-full p-3 hover:bg-slate-100 rounded-md transition-colors">
      <div className="flex items-center">
        <Icon className="h-5 w-5 mr-3 text-muted-foreground" />
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      <div className="flex items-center">
        {value && <span className="text-sm text-muted-foreground mr-2">{value}</span>}
        {(href || onClick) && <ChevronRight className="h-5 w-5 text-muted-foreground" />}
      </div>
    </div>
  )

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    )
  }
  return (
    <button onClick={onClick} className="block w-full text-left">
      {content}
    </button>
  )
}

export default function UserProfileScreen() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<UserData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { isSupported: isBiometricSupported, hasCredentials } = useBiometricAuth()

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true)
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !authUser) {
        setIsLoading(false) // Ensure loading state is updated
        if (authError) {
          // If there's a specific error from Supabase
          console.error("Error fetching authenticated user:", authError)
          setError(authError.message || "Erreur lors de la récupération de l'utilisateur.")
        } else {
          // No specific error, but user is not authenticated (e.g., dummy client or no active session)
          console.log("User not authenticated. Redirecting to login.")
          setError("Utilisateur non authentifié. Redirection vers la connexion...")
        }
        setTimeout(() => router.push("/signin"), 2000)
        return
      }

      // Fetch profile data from 'user_profiles' table
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("full_name, avatar_url, phone, preferred_currency, created_at")
        .eq("id", authUser.id)
        .single()

      if (profileError && profileError.code !== "PGRST116") {
        // PGRST116: no rows found, which is fine if profile not created yet
        console.error("Error fetching profile:", profileError)
        setError("Erreur lors de la récupération du profil.")
      }

      setUser({
        id: authUser.id,
        name: profileData?.full_name || authUser.email?.split("@")[0] || "Utilisateur",
        email: authUser.email || "Non défini",
        avatarUrl: profileData?.avatar_url || undefined,
        phone: profileData?.phone || undefined,
        defaultCurrency: profileData?.preferred_currency || undefined,
        memberSince: profileData?.created_at || authUser.created_at,
      })
      setIsLoading(false)
    }
    fetchUser()
  }, [supabase, router])

  const handleLogout = async () => {
    setIsLoading(true)
    const { error: signOutError } = await supabase.auth.signOut()
    setIsLoading(false)
    if (signOutError) {
      setError(`Erreur lors de la déconnexion: ${signOutError.message}`)
      alert(`Erreur lors de la déconnexion: ${signOutError.message}`)
    } else {
      router.push("/signin") // Rediriger vers la page de connexion après déconnexion
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <p>Chargement du profil...</p>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Erreur</h2>
        <p className="text-muted-foreground">{error || "Impossible de charger les informations utilisateur."}</p>
        <Button onClick={() => router.push("/signin")} className="mt-6">
          Aller à la Connexion
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <Avatar className="h-24 w-24 mx-auto mb-3 ring-2 ring-primary/50 ring-offset-2">
          <AvatarImage src={user.avatarUrl || "/placeholder.svg?width=100&height=100&query=avatar"} alt={user.name} />
          <AvatarFallback className="text-3xl">{user.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <h2 className="text-xl font-semibold">{user.name}</h2>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => router.push('/dashboard/profile/edit')}
        >
          <Edit3 className="h-4 w-4 mr-2" /> Modifier le profil
        </Button>
      </div>

      <Separator />

      <div className="space-y-3">
        <Card className="shadow-sm">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-base">Informations Personnelles</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ProfileLinkItem icon={User} label="Nom complet" value={user.name} />
            <ProfileLinkItem icon={Mail} label="Adresse e-mail" value={user.email} />
            <ProfileLinkItem icon={Phone} label="Téléphone" value={user.phone || "Non défini"} />
            {user.memberSince && (
              <ProfileLinkItem
                icon={CalendarDays}
                label="Membre depuis"
                value={format(parseISO(user.memberSince), "d MMMM yyyy", { locale: fr })}
              />
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-base">Préférences</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ProfileLinkItem
              icon={DollarSign}
              label="Devise par défaut"
              value={user.defaultCurrency || "Non définie"}
              onClick={() => alert("Navigation vers les paramètres de devise (non implémenté)")}
            />
            <ProfileLinkItem
              icon={Bell}
              label="Préférences de notification"
              onClick={() => alert("Navigation vers les paramètres de notification (non implémenté)")}
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-base">Sécurité et Support</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ProfileLinkItem
              icon={ShieldCheck}
              label="Changer le mot de passe"
              onClick={() => alert("Navigation vers la page de changement de mot de passe (non implémenté)")}
            />
            {isBiometricSupported && (
              <ProfileLinkItem
                icon={Fingerprint}
                label="Authentification biométrique"
                value={hasCredentials ? "Activée" : "Configurer"}
                onClick={() => router.push('/dashboard/parametres/biometrique')}
              />
            )}
            <ProfileLinkItem
              icon={HelpCircle}
              label="Aide et Support"
              onClick={() => alert("Navigation vers la page d'aide (non implémenté)")}
            />
          </CardContent>
        </Card>
      </div>

      <div className="p-4 border-t bg-slate-50">
        <Button variant="destructive" className="w-full h-11" onClick={handleLogout} disabled={isLoading}>
          {isLoading ? <Hourglass className="mr-2 h-5 w-5 animate-spin" /> : <LogOut className="mr-2 h-5 w-5" />}
          {isLoading ? "Déconnexion..." : "Se Déconnecter"}
        </Button>
      </div>
    </div>
  )
}
