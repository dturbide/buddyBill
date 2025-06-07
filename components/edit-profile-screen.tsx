"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Save, 
  Camera, 
  AlertCircle, 
  CheckCircle2,
  Loader2,
  User,
  Mail,
  Phone,
  DollarSign 
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface UserData {
  id: string
  name: string
  email: string
  avatarUrl?: string
  phone?: string
  defaultCurrency?: string
}

interface FormData {
  name: string
  phone: string
  defaultCurrency: string
}

const currencies = [
  { code: 'CAD', name: 'Dollar canadien', symbol: '$' },
  { code: 'USD', name: 'Dollar américain', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'Livre sterling', symbol: '£' },
  { code: 'CHF', name: 'Franc suisse', symbol: 'CHF' },
  { code: 'JPY', name: 'Yen japonais', symbol: '¥' },
  { code: 'AUD', name: 'Dollar australien', symbol: '$' },
]

export default function EditProfileScreen() {
  const [user, setUser] = useState<UserData | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    defaultCurrency: 'CAD'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  // Charger les données utilisateur
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Obtenir l'utilisateur actuel
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !authUser) {
          throw new Error('Utilisateur non authentifié')
        }

        // Obtenir le profil utilisateur étendu
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (profileError) {
          console.warn('Erreur lors du chargement du profil:', profileError)
        }

        const userData: UserData = {
          id: authUser.id,
          name: profile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Utilisateur',
          email: authUser.email || '',
          avatarUrl: profile?.avatar_url || authUser.user_metadata?.avatar_url,
          phone: profile?.phone_number || '',
          defaultCurrency: profile?.default_currency || 'CAD'
        }

        setUser(userData)
        setFormData({
          name: userData.name,
          phone: userData.phone || '',
          defaultCurrency: userData.defaultCurrency || 'CAD'
        })

      } catch (err) {
        console.error('Erreur lors du chargement des données utilisateur:', err)
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [supabase])

  // Gérer les changements du formulaire
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Sauvegarder les modifications
  const handleSave = async () => {
    if (!user) return

    try {
      setIsSaving(true)
      setError(null)

      // Mettre à jour le profil utilisateur
      const { error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          full_name: formData.name.trim(),
          phone_number: formData.phone.trim() || null,
          default_currency: formData.defaultCurrency,
          updated_at: new Date().toISOString()
        })

      if (updateError) {
        throw updateError
      }

      // Mettre à jour les métadonnées auth si le nom a changé
      if (formData.name.trim() !== user.name) {
        const { error: authError } = await supabase.auth.updateUser({
          data: {
            full_name: formData.name.trim()
          }
        })

        if (authError) {
          console.warn('Erreur lors de la mise à jour des métadonnées:', authError)
          // Ne pas échouer complètement si seulement les métadonnées échouent
        }
      }

      toast({
        title: "✅ Profil mis à jour",
        description: "Vos informations ont été sauvegardées avec succès.",
      })

      // Retourner à la page de profil
      router.push('/dashboard/profile')

    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
      toast({
        title: "❌ Erreur",
        description: `Impossible de sauvegarder : ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Valider le formulaire
  const isFormValid = formData.name.trim().length > 0

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Chargement du profil...</p>
      </div>
    )
  }

  if (error && !user) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Erreur</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => router.push("/dashboard/profile")}>
          Retour au profil
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête du profil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informations de base
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar et email (lecture seule) */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-20 w-20 ring-2 ring-primary/20">
                <AvatarImage 
                  src={user?.avatarUrl || "/placeholder.svg?width=80&height=80&query=avatar"} 
                  alt={user?.name || "Avatar"} 
                />
                <AvatarFallback className="text-lg">
                  {user?.name?.substring(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <Button 
                size="sm" 
                variant="outline" 
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full p-0"
                onClick={() => toast({
                  title: "🚧 Fonctionnalité à venir",
                  description: "La modification d'avatar sera bientôt disponible.",
                })}
              >
                <Camera className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="text-center space-y-1">
              <Badge variant="outline" className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {user?.email}
              </Badge>
              <p className="text-xs text-muted-foreground">
                L'adresse email ne peut pas être modifiée
              </p>
            </div>
          </div>

          <Separator />

          {/* Formulaire d'édition */}
          <div className="space-y-4">
            {/* Nom complet */}
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Votre nom complet"
                disabled={isSaving}
              />
            </div>

            {/* Téléphone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Ex: +1 (555) 123-4567"
                disabled={isSaving}
              />
            </div>

            {/* Devise par défaut */}
            <div className="space-y-2">
              <Label htmlFor="currency">Devise par défaut</Label>
              <Select
                value={formData.defaultCurrency}
                onValueChange={(value) => handleInputChange('defaultCurrency', value)}
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une devise" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{currency.symbol}</span>
                        <span>{currency.code}</span>
                        <span className="text-muted-foreground">- {currency.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message d'erreur */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Boutons d'action */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => router.push('/dashboard/profile')}
          disabled={isSaving}
        >
          Annuler
        </Button>
        
        <Button
          className="flex-1"
          onClick={handleSave}
          disabled={!isFormValid || isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
