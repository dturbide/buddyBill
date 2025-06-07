"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Users, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function JoinGroupScreen() {
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inviteCode.trim()) {
      setError("Veuillez entrer un code d'invitation")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inviteCode: inviteCode.trim()
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(`Vous avez rejoint le groupe "${result.groupName}" avec succès !`)
        // Redirection vers la liste des groupes après 2 secondes
        setTimeout(() => {
          router.push("/dashboard/groups")
        }, 2000)
      } else {
        setError(result.error || "Erreur lors de l'ajout au groupe")
      }
    } catch (error) {
      console.error("Erreur:", error)
      setError("Erreur de connexion. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  const formatCode = (value: string) => {
    // Supprimer tous les caractères non alphanumériques et convertir en majuscules
    const cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase()
    // Limiter à 12 caractères
    return cleaned.slice(0, 12)
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCode(e.target.value)
    setInviteCode(formatted)
    setError(null)
    setSuccess(null)
  }

  return (
    <div className="w-full max-w-md h-[800px] max-h-[90vh] bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col">
      <header className="p-4 flex items-center border-b sticky top-0 bg-white z-10">
        <Link href="/dashboard" className="mr-3">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold text-gray-800 flex-grow text-center">
          Rejoindre un Groupe
        </h1>
      </header>

      <div className="flex-grow overflow-y-auto p-6 flex flex-col justify-center">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Entrez le Code d'Invitation
          </h2>
          <p className="text-sm text-gray-600">
            Demandez le code d'invitation à l'organisateur du groupe
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center text-base">Code d'Invitation</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="inviteCode">Code (12 caractères)</Label>
                <Input
                  id="inviteCode"
                  type="text"
                  value={inviteCode}
                  onChange={handleCodeChange}
                  placeholder="Ex: ABC123DEF456"
                  maxLength={12}
                  className="text-center text-lg font-mono tracking-wider"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  {inviteCode.length}/12 caractères
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                  <p className="text-sm">{success}</p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 text-base" 
                disabled={!inviteCode.trim() || isLoading || success !== null}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Vérification..." : "Rejoindre le Groupe"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-2">
            Vous n'avez pas de code d'invitation ?
          </p>
          <Link href="/create-group">
            <Button variant="outline" className="w-full">
              Créer un Nouveau Groupe
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
