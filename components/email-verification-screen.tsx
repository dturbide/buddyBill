"use client"

import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MailCheck, MailWarning, Hourglass, Edit3, SkipForward, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation" // Removed useSearchParams from here
import { createClient } from "@/lib/supabase/client"

interface EmailVerificationScreenProps {
  emailFromParams: string | null
}

export default function EmailVerificationScreen({ emailFromParams }: EmailVerificationScreenProps) {
  const router = useRouter()
  const supabase = createClient()

  // Use the email passed as a prop
  const userEmail = emailFromParams || "votre.email@example.com"

  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [showChangeEmail, setShowChangeEmail] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [resendCooldown])

  const handleResendEmail = async () => {
    if (resendCooldown > 0 || !userEmail) return
    setIsResending(true)
    setError(null)
    setSuccessMessage(null)

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: userEmail,
    })

    setIsResending(false)
    if (resendError) {
      setError(resendError.message)
    } else {
      setSuccessMessage("Email de vérification renvoyé avec succès.")
      setResendCooldown(60)
    }
  }

  const handleChangeEmail = async () => {
    setError(null)
    setSuccessMessage(null)
    if (!newEmail || !/\S+@\S+\.\S+/.test(newEmail)) {
      setError("Veuillez entrer une nouvelle adresse email valide.")
      return
    }
    console.log("Demande de changement d'email vers :", newEmail)
    alert(
      `Demande de changement d'email vers ${newEmail}. Dans une vraie application, cela déclencherait une nouvelle inscription ou un flux de mise à jour d'email plus complexe.`,
    )
    router.push(`/registration-example?email=${encodeURIComponent(newEmail)}`)
    setShowChangeEmail(false)
  }

  const handleSkipForNow = () => {
    router.push("/login-example")
  }

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        if (session.user.email_confirmed_at) {
          router.push("/dashboard-example")
        }
      }
    })
    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [router, supabase])

  return (
    <div className="w-full max-w-md h-[800px] max-h-[90vh] bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col">
      <header className="p-4 flex items-center border-b sticky top-0 bg-white z-10">
        <h1 className="text-lg font-semibold text-gray-800 flex-grow text-center">Vérifiez Votre Email</h1>
      </header>
      <div className="flex-grow overflow-y-auto p-6 flex flex-col items-center justify-center text-center space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center w-full">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <p className="text-sm text-left">{error}</p>
          </div>
        )}
        {successMessage && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-center w-full">
            <MailCheck className="h-5 w-5 mr-2 flex-shrink-0" />
            <p className="text-sm text-left">{successMessage}</p>
          </div>
        )}
        <MailCheck className="h-20 w-20 text-primary" />
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Confirmez Votre Adresse Email</h2>
          <p className="text-muted-foreground px-4">
            Nous avons envoyé un lien de vérification à <br />
            <span className="font-medium text-foreground">{userEmail}</span>.
          </p>
          <p className="text-sm text-muted-foreground">
            Veuillez consulter votre boîte de réception (et le dossier spam) et cliquer sur le lien pour finaliser votre
            inscription.
          </p>
        </div>
        {showChangeEmail ? (
          <div className="w-full space-y-3 pt-4">
            <Input
              type="email"
              placeholder="Entrez la nouvelle adresse email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="text-center"
            />
            <Button
              onClick={handleChangeEmail}
              className="w-full"
              disabled={!newEmail || !/\S+@\S+\.\S+/.test(newEmail)}
            >
              Soumettre la Nouvelle Email
            </Button>
            <Button variant="ghost" onClick={() => setShowChangeEmail(false)} className="w-full">
              Annuler
            </Button>
          </div>
        ) : (
          <div className="w-full space-y-3 pt-4">
            <Button
              onClick={handleResendEmail}
              disabled={isResending || resendCooldown > 0 || !userEmail}
              className="w-full"
            >
              {isResending ? (
                <Hourglass className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MailWarning className="mr-2 h-4 w-4" />
              )}
              {resendCooldown > 0 ? `Renvoyer l'Email (${resendCooldown}s)` : "Renvoyer l'Email de Vérification"}
            </Button>
            <Button variant="outline" onClick={() => setShowChangeEmail(true)} className="w-full">
              <Edit3 className="mr-2 h-4 w-4" /> Changer d'Adresse Email
            </Button>
            <Button variant="ghost" onClick={handleSkipForNow} className="w-full text-muted-foreground">
              <SkipForward className="mr-2 h-4 w-4" /> Passer pour l'instant
            </Button>
          </div>
        )}
        <p className="text-xs text-muted-foreground pt-4">
          Vous n'avez pas reçu l'email ? Assurez-vous que votre adresse email est correcte ou essayez de le renvoyer.
        </p>
      </div>
    </div>
  )
}
