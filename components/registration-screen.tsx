"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Eye, EyeOff, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client" // Import Supabase client

const countryCodes = [
  { code: "+1", country: "USA", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+91", country: "India", flag: "🇮🇳" },
]

export default function RegistrationScreen() {
  const router = useRouter()
  const supabase = createClient() // Initialize Supabase client

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [selectedCountryCode, setSelectedCountryCode] = useState(countryCodes[0].code)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculatePasswordStrength = (pass: string) => {
    let strength = 0
    if (pass.length >= 8) strength += 25
    if (pass.match(/[A-Z]/)) strength += 25
    if (pass.match(/[a-z]/)) strength += 25
    if (pass.match(/[0-9]/) || pass.match(/[^A-Za-z0-9]/)) strength += 25
    setPasswordStrength(strength)
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    calculatePasswordStrength(newPassword)
  }

  const isFormValid = () => {
    return (
      firstName &&
      lastName &&
      email &&
      /\S+@\S+\.\S+/.test(email) &&
      password &&
      password.length >= 8 &&
      password === confirmPassword &&
      termsAccepted
    )
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 50) return "bg-red-500"
    if (passwordStrength < 75) return "bg-yellow-500"
    return "bg-green-500"
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isFormValid()) {
      setError("Veuillez remplir tous les champs requis correctement.")
      return
    }
    setIsLoading(true)
    setError(null)

    console.log("Tentative d'inscription avec:", { email, firstName, lastName })

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: `${firstName} ${lastName}`,
          phone: `${selectedCountryCode}${phone}`,
        },
      },
    })

    console.log("Résultat de l'inscription:", { data, signUpError })

    if (signUpError) {
      console.error("Erreur Supabase:", signUpError)
      setError(`Erreur lors de la création du compte: ${signUpError.message}`)
      setIsLoading(false)
    } else {
      // Rediriger vers la page de vérification d'email ou le dashboard
      router.push("/dashboard") 
    }
  }

  return (
    <div className="w-full max-w-md h-[800px] max-h-[90vh] bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col">
      <header className="p-4 flex items-center border-b sticky top-0 bg-white z-10">
        <Link href="/welcome" passHref legacyBehavior>
          <Button variant="ghost" size="icon" className="mr-2" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold text-gray-800">Créer un Compte</h1>
      </header>
      <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        <div>
          <Label htmlFor="firstName">Prénom</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Votre prénom"
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName">Nom</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Votre nom"
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Adresse Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@example.com"
            required
          />
          {email && !/\S+@\S+\.\S+/.test(email) && (
            <p className="text-xs text-red-500 mt-1">Veuillez entrer un email valide.</p>
          )}
        </div>
        <div>
          <Label htmlFor="phone">Numéro de Téléphone (Optionnel)</Label>
          <div className="flex gap-2">
            <Select value={selectedCountryCode} onValueChange={setSelectedCountryCode}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Code" />
              </SelectTrigger>
              <SelectContent>
                {countryCodes.map((cc) => (
                  <SelectItem key={cc.code} value={cc.code}>
                    {cc.flag} {cc.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Numéro de téléphone"
              className="flex-1"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="password">Mot de Passe</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={handlePasswordChange}
              placeholder="Créez un mot de passe fort"
              required
              autoComplete="new-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {password && (
            <div className="mt-1.5">
              <Progress value={passwordStrength} className="h-1.5" indicatorClassName={getPasswordStrengthColor()} />
              <p className="text-xs mt-1">
                Force du mot de passe : {passwordStrength < 50 ? "Faible" : passwordStrength < 75 ? "Moyen" : "Fort"}
              </p>
            </div>
          )}
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirmer le Mot de Passe</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmez votre mot de passe"
              required
              autoComplete="new-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {password && confirmPassword && password !== confirmPassword && (
            <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas.</p>
          )}
        </div>
        <div className="flex items-center space-x-2 pt-2">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
          />
          <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground">
            J'accepte les{" "}
            <Link href="/terms" className="underline hover:text-primary">
              Conditions d'Utilisation
            </Link>{" "}
            et la{" "}
            <Link href="/privacy" className="underline hover:text-primary">
              Politique de Confidentialité
            </Link>
            .
          </Label>
        </div>
      </form>
      <div className="p-4 border-t bg-slate-50 sticky bottom-0">
        <Button
          type="submit"
          form="registration-form"
          className="w-full h-12 text-base"
          disabled={!isFormValid() || isLoading}
          onClick={(e) => document.querySelector<HTMLFormElement>("form")?.requestSubmit()}
        >
          {isLoading ? "Création en cours..." : "Créer un Compte"}
        </Button>
        <p className="mt-4 text-center text-sm">
          Déjà un compte ?{" "}
          <Link href="/signin" className="font-medium text-primary hover:underline">
            Se Connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
RegistrationScreen.defaultProps = {}
