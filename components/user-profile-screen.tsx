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
  CreditCard,
  Database,
  Wifi,
  WifiOff
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
import { useBiometricAuth } from "@/hooks/use-biometric-auth"
import { OfflineIndicator } from "@/components/offline-indicator"
import { ConflictResolver } from "@/components/conflict-resolver"
import { useConflictResolution } from "@/hooks/use-conflict-resolution"

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
  const { conflicts, resolveConflict } = useConflictResolution()

  // Fonction utilitaire pour formater les montants selon la devise
  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    const currencySymbols: { [key: string]: string } = {
      'CAD': '$',
      'USD': '$', 
      'EUR': '€',
      'GBP': '£',
      'CHF': 'CHF ',
      'JPY': '¥',
      'AUD': 'A$'
    }
    
    const symbol = currencySymbols[currency] || currency + ' '
    const formattedAmount = Math.abs(amount).toFixed(2)
    const sign = amount >= 0 ? '+' : '-'
    
    // Pour JPY, pas de décimales
    if (currency === 'JPY') {
      return `${sign}${symbol}${Math.abs(amount).toFixed(0)}`
    }
    
    // Pour CHF et autres devises avec symbole après
    if (currency === 'CHF') {
      return `${sign}${symbol}${formattedAmount}`
    }
    
    return `${sign}${symbol}${formattedAmount}`
  }

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
        avatarUrl: profileData?.avatar_url,
        phone: profileData?.phone,
        defaultCurrency: profileData?.preferred_currency || "CAD",
        memberSince: profileData?.created_at || authUser.created_at,
      })
      setIsLoading(false)
    }

    fetchUser()
  }, [router, supabase])

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
      router.push("/signin")
    } catch (error) {
      console.error("Logout error:", error)
      setError("Erreur lors de la déconnexion")
      setIsLoading(false)
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
      {/* Indicateur offline-first détaillé */}
      <OfflineIndicator variant="detailed" />
      
      {/* Résolveur de conflits si nécessaire */}
      {conflicts.length > 0 && (
        <ConflictResolver 
          onConflictsResolved={() => {
            console.log('Tous les conflits ont été résolus')
          }} 
        />
      )}
      
      <div className="text-center">
        <Avatar className="h-24 w-24 mx-auto mb-3 ring-2 ring-primary/50 ring-offset-2">
          <AvatarImage src={user.avatarUrl || "/placeholder.svg?width=100&height=100&query=avatar"} alt={user.name} />
          <AvatarFallback className="text-xl font-bold bg-primary/10">
            {user.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
          </AvatarFallback>
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
              icon={CreditCard}
              label="Devise préférée"
              value={user.defaultCurrency || "Non définie"}
            />
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
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Vue Multi-Devises
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Aperçu de vos montants dans différentes devises
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Section principale - devise préférée */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-700">Devise principale ({user.defaultCurrency || 'EUR'})</span>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-800">{formatCurrency(125.50, user.defaultCurrency)}</div>
                  <div className="text-xs text-blue-600">Vous devez recevoir</div>
                </div>
              </div>
            </div>

            {/* Autres devises */}
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">🇺🇸 USD</span>
                  <span className="text-xs text-muted-foreground">États-Unis</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-green-600">{formatCurrency(142.30, 'USD')}</div>
                  <div className="text-xs text-muted-foreground">≈ {formatCurrency(127.85, user.defaultCurrency)}</div>
                </div>
              </div>

              <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">🇨🇦 CAD</span>
                  <span className="text-xs text-muted-foreground">Canada</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-red-600">{formatCurrency(-45.20, 'CAD')}</div>
                  <div className="text-xs text-muted-foreground">≈ {formatCurrency(-31.15, user.defaultCurrency)}</div>
                </div>
              </div>

              <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">🇬🇧 GBP</span>
                  <span className="text-xs text-muted-foreground">Royaume-Uni</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-green-600">{formatCurrency(28.80, 'GBP')}</div>
                  <div className="text-xs text-muted-foreground">≈ {formatCurrency(33.45, user.defaultCurrency)}</div>
                </div>
              </div>
            </div>

            {/* Total consolidé */}
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total net équivalent</span>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">{formatCurrency(129.15, user.defaultCurrency)}</div>
                  <div className="text-xs text-muted-foreground">Mis à jour il y a 2h</div>
                </div>
              </div>
            </div>
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
              onClick={() => router.push('/dashboard/help')}
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
