"use client"
import { useState } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Fingerprint, Mail, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useBiometricAuth } from "@/hooks/use-biometric-auth"

export default function LoginScreen() {
  const router = useRouter()
  const supabase = createClient()

  // Hook pour l'authentification biométrique
  const {
    isSupported: isBiometricSupported,
    hasCredentials,
    biometricType,
    authenticate: authenticateBiometric,
    isLoading: isBiometricLoading,
    error: biometricError
  } = useBiometricAuth()

  const [emailOrUsername, setEmailOrUsername] = useState("") // Supabase utilise l'email pour la connexion
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false) // La gestion du "Remember Me" avec Supabase est gérée par la durée de vie du cookie de session
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isFormValid = () => {
    return emailOrUsername && password
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isFormValid()) {
      setError("Veuillez entrer votre email et mot de passe.")
      return
    }
    setIsLoading(true)
    setError(null)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: emailOrUsername, // Assumons que c'est l'email
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setIsLoading(false)
    } else {
      // Rediriger vers le tableau de bord ou la page d'accueil après connexion réussie
      router.push("/dashboard")
    }
  }

  const handleBiometricLogin = async () => {
    try {
      setError(null) // Clear existing errors
      const success = await authenticateBiometric()
      
      if (success) {
        // Rediriger vers le tableau de bord après connexion réussie
        router.push("/dashboard")
      } else if (biometricError) {
        setError(biometricError)
      }
    } catch (error) {
      setError("Erreur lors de la connexion biométrique")
    }
  }

  return (
    <div className="w-full max-w-md h-[800px] max-h-[90vh] bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col">
      <header className="p-4 flex items-center border-b sticky top-0 bg-white z-10">
        <h1 className="text-lg font-semibold text-gray-800 flex-grow text-center">Bon Retour !</h1>
      </header>
      <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-6 flex flex-col justify-center">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        <div className="space-y-5">
          <div>
            <Label htmlFor="emailOrUsername">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="emailOrUsername"
                type="email"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="Entrez votre email"
                required
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center">
              <Label htmlFor="password">Mot de Passe</Label>
              <Link href="/forgot-password-example" className="text-sm text-primary hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez votre mot de passe"
                required
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Cacher mot de passe" : "Afficher mot de passe"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="rememberMe"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            />
            <Label htmlFor="rememberMe" className="text-sm font-normal text-muted-foreground">
              Se souvenir de moi
            </Label>
          </div>
        </div>
        <div className="space-y-4 mt-8">
          <Button type="submit" className="w-full h-12 text-base" disabled={!isFormValid() || isLoading}>
            {isLoading ? "Connexion en cours..." : "Se Connecter"}
          </Button>
          {isBiometricSupported && (
            <Button 
              type="button"
              variant="outline" 
              className="w-full h-12 text-base" 
              onClick={handleBiometricLogin}
              disabled={isBiometricLoading || !hasCredentials}
            >
              {isBiometricLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Authentification...
                </>
              ) : (
                <>
                  <Fingerprint className="mr-2 h-5 w-5" />
                  {hasCredentials ? `Connexion ${biometricType}` : `Configurer ${biometricType}`}
                </>
              )}
            </Button>
          )}
        </div>
      </form>
      <div className="p-4 border-t bg-slate-50 sticky bottom-0">
        <p className="text-center text-sm">
          Pas encore de compte ?{" "}
          <Link href="/registration-example" className="font-medium text-primary hover:underline">
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  )
}
LoginScreen.defaultProps = {}
