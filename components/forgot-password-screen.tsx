"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Mail, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function ForgotPasswordScreen() {
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError("Veuillez entrer une adresse email valide.")
      return
    }
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`, // URL de redirection après clic sur le lien dans l'email
    })

    setIsLoading(false)
    if (resetError) {
      setError(resetError.message)
    } else {
      setIsSubmitted(true)
      setSuccessMessage(`Si un compte existe pour ${email}, un email de réinitialisation de mot de passe a été envoyé.`)
    }
  }

  if (isSubmitted) {
    return (
      <div className="w-full max-w-md h-[800px] max-h-[90vh] bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col">
        <header className="p-4 flex items-center border-b sticky top-0 bg-white z-10">
          <Button variant="ghost" size="icon" className="mr-2" onClick={() => setIsSubmitted(false)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-800 flex-grow text-center">Email Envoyé</h1>
        </header>
        <div className="flex-grow overflow-y-auto p-6 flex flex-col items-center justify-center text-center space-y-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
          <h2 className="text-xl font-semibold">Vérifiez Votre Email</h2>
          <p className="text-muted-foreground">{successMessage}</p>
          <Button onClick={() => (window.location.href = "/login-example")} className="w-full max-w-xs">
            Retour à la Connexion
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md h-[800px] max-h-[90vh] bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col">
      <header className="p-4 flex items-center border-b sticky top-0 bg-white z-10">
        <Link href="/login-example" passHref legacyBehavior>
          <Button variant="ghost" size="icon" className="mr-2" aria-label="Back to login">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold text-gray-800">Réinitialiser le Mot de Passe</h1>
      </header>
      <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-6 flex flex-col">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">
            Entrez l'adresse email associée à votre compte, et nous vous enverrons un lien pour réinitialiser votre mot
            de passe.
          </p>
        </div>
        <div>
          <Label htmlFor="email">Adresse Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@example.com"
              required
              className="pl-10"
            />
          </div>
          {email && !/\S+@\S+\.\S+/.test(email) && (
            <p className="text-xs text-red-500 mt-1">Veuillez entrer une adresse email valide.</p>
          )}
        </div>
        <div className="mt-auto space-y-4">
          <Button
            type="submit"
            className="w-full h-12 text-base"
            disabled={!email || !/\S+@\S+\.\S+/.test(email) || isLoading}
          >
            {isLoading ? "Envoi en cours..." : "Envoyer le Lien de Réinitialisation"}
          </Button>
          <p className="text-center text-sm">
            Vous vous souvenez de votre mot de passe ?{" "}
            <Link href="/login-example" className="font-medium text-primary hover:underline">
              Se Connecter
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}
ForgotPasswordScreen.defaultProps = {}
