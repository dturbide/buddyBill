"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Camera, Check, ChevronRight, ChevronLeft, ImageIcon, AlertCircle, Loader2, Copy, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { POPULAR_CURRENCIES, ALL_CURRENCIES, getCurrencyByCode } from "@/lib/currencies"

const groupTypes = ["Voyage", "Colocataires", "Amis", "Événement", "Projet", "Autre"]

// ... (dummyContacts can remain for UI, but member addition logic needs more work)

export default function CreateGroupScreen() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3 // Keeping 3 steps for UI, but submission happens at the end of step 2 for core data
  const [groupName, setGroupName] = useState("")
  const [groupDescription, setGroupDescription] = useState("")
  const [groupType, setGroupType] = useState("")
  const [groupImage, setGroupImage] = useState<File | null>(null)
  const [groupImagePreview, setGroupImagePreview] = useState<string | null>(null)
  const [defaultCurrency, setDefaultCurrency] = useState(POPULAR_CURRENCIES[0].code)
  const [searchCurrency, setSearchCurrency] = useState("")
  const [isInviteOnly, setIsInviteOnly] = useState(true)
  const [requireApproval, setRequireApproval] = useState(false)
  // Member selection state (UI only for now, not part of initial group creation action)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [manualEmail, setManualEmail] = useState("")
  const [sendInvitations, setSendInvitations] = useState(true)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0]
      setGroupImage(file)
      setGroupImagePreview(URL.createObjectURL(file))
      // TODO: Implement actual image upload to Supabase Storage here
      // For now, groupImagePreview (a blob URL) will be passed to the action,
      // but a real implementation would upload, get the public URL, and store that.
      // This is a simplification.
    }
  }

  const nextStep = async () => {
    setError(null)
    
    // Si on est à l'étape 2, créer le groupe
    if (currentStep === 2) {
      setIsLoading(true)
      try {
        console.log('🆕 FRONTEND CREATE - Début création groupe')
        console.log('🆕 FRONTEND CREATE - Données:', {
          groupName,
          groupDescription,
          groupType,
          defaultCurrency,
          isInviteOnly,
          requireApproval,
        })

        const response = await fetch('/api/groups/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            groupName,
            groupDescription,
            groupType,
            groupImagePreview,
            defaultCurrency,
            isInviteOnly,
            requireApproval,
          }),
        })
        
        const result = await response.json()
        console.log('🆕 FRONTEND CREATE - Réponse API:', result)
        
        if (result.success) {
          setSuccessMessage(result.message || "Groupe créé avec succès !")
          setInviteCode(result.inviteCode)
          // Aller à l'étape 3 pour afficher le code d'invitation
          setCurrentStep(currentStep + 1)
        } else {
          console.error('🆕 FRONTEND CREATE - Erreur:', result.error)
          setError(result.error || "Erreur lors de la création du groupe.")
        }
      } catch (error) {
        console.error("🆕 FRONTEND CREATE - Erreur inattendue:", error)
        setError("Une erreur inattendue s'est produite.")
      } finally {
        setIsLoading(false)
      }
    } 
    // Si on est à l'étape 3 (succès), rediriger vers le dashboard
    else if (currentStep === 3 && successMessage) {
      router.push("/dashboard")
    }
    // Sinon, passer à l'étape suivante normalement
    else if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const progressValue = (currentStep / totalSteps) * 100

  const copyInviteCode = async () => {
    if (inviteCode) {
      try {
        await navigator.clipboard.writeText(inviteCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Erreur lors de la copie:', err)
      }
    }
  }

  const filteredCurrencies = ALL_CURRENCIES.filter((currency) =>
    currency.code.toLowerCase().includes(searchCurrency.toLowerCase()) ||
    currency.name.toLowerCase().includes(searchCurrency.toLowerCase())
  )

  return (
    <div className="w-full max-w-md h-[800px] max-h-[90vh] bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col">
      <header className="p-4 flex items-center border-b sticky top-0 bg-white z-10">
        {currentStep === 1 ? (
          <Link href="/groups-list-example" passHref legacyBehavior>
            <Button variant="ghost" size="icon" className="mr-2" aria-label="Back to groups list">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
        ) : (
          <Button variant="ghost" size="icon" className="mr-2" onClick={prevStep} aria-label="Previous step">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-lg font-semibold text-gray-800">Créer un Nouveau Groupe</h1>
      </header>
      <div className="p-4 border-b">
        <Progress value={progressValue} className="w-full h-2" />
        <p className="text-xs text-muted-foreground text-center mt-1">
          Étape {currentStep} sur {totalSteps}
        </p>
      </div>
      <div className="flex-grow overflow-y-auto p-6 space-y-6">
        {error && (
          <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <p className="text-sm text-left">{error}</p>
          </div>
        )}
        {successMessage && (
          <div className="p-3 mb-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
            <div className="flex items-center mb-2">
              <Check className="h-5 w-5 mr-2 flex-shrink-0" />
              <p className="text-sm">{successMessage}</p>
            </div>
            {inviteCode && (
              <div className="mt-3 p-3 bg-white border border-green-300 rounded-md">
                <p className="text-sm text-gray-700 mb-2">Code d'invitation :</p>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-lg font-mono bg-gray-100 px-3 py-2 rounded border flex-grow text-center">
                    {inviteCode}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyInviteCode}
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Copié
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1 h-4 w-4" />
                        Copier
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Partagez ce code avec les personnes que vous souhaitez inviter
                </p>
              </div>
            )}
          </div>
        )}
        {currentStep === 1 && (
          <div className="space-y-5 animate-fadeIn">
            <h2 className="text-base font-semibold text-gray-700">1. Informations de Base</h2>
            <div>
              <Label htmlFor="groupName">Nom du Groupe</Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Ex: Vacances d'été 2025"
                required
              />
            </div>
            <div>
              <Label htmlFor="groupDescription">Description du Groupe (Optionnel)</Label>
              <Textarea
                id="groupDescription"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Une brève description de votre groupe"
              />
            </div>
            <div>
              <Label htmlFor="groupType">Type de Groupe</Label>
              <Select value={groupType} onValueChange={setGroupType}>
                <SelectTrigger id="groupType">
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  {groupTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Image du Groupe (Optionnel)</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 rounded-lg">
                  <AvatarImage
                    src={groupImagePreview || "/placeholder.svg?width=80&height=80&query=group+icon"}
                    alt="Aperçu image groupe"
                  />
                  <AvatarFallback>
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("groupImageUpload")?.click()}
                >
                  <Camera className="mr-2 h-4 w-4" /> Télécharger Image
                </Button>
                <Input
                  type="file"
                  id="groupImageUpload"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        )}
        {currentStep === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <h2 className="text-base font-semibold text-gray-700">2. Paramètres</h2>
            <div className="space-y-2">
              <Label htmlFor="defaultCurrency">Devise par Défaut</Label>
              <div className="space-y-2">
                <Input
                  type="search"
                  value={searchCurrency}
                  onChange={(e) => setSearchCurrency(e.target.value)}
                  placeholder="Rechercher une devise (ex: JPY, Yen)"
                  className="w-full"
                />
                <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
                  <SelectTrigger id="defaultCurrency">
                    <SelectValue>
                      {getCurrencyByCode(defaultCurrency)?.flag} {getCurrencyByCode(defaultCurrency)?.name} ({defaultCurrency})
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-40 overflow-y-auto">
                    {/* Devises populaires en premier si pas de recherche */}
                    {!searchCurrency && (
                      <>
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Populaires</div>
                        {POPULAR_CURRENCIES.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            <span className="flex items-center gap-2">
                              <span>{currency.flag}</span>
                              <span>{currency.name}</span>
                              <span className="text-muted-foreground">({currency.code})</span>
                            </span>
                          </SelectItem>
                        ))}
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">Toutes les devises</div>
                      </>
                    )}
                    {/* Devises filtrées */}
                    {filteredCurrencies
                      .filter(currency => searchCurrency ? true : !currency.popular)
                      .slice(0, 50) // Limiter à 50 résultats pour les performances
                      .map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          <span className="flex items-center gap-2">
                            <span>{currency.flag}</span>
                            <span>{currency.name}</span>
                            <span className="text-muted-foreground">({currency.code})</span>
                          </span>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <Label htmlFor="isInviteOnly" className="font-medium">
                  Groupe sur Invitation Uniquement
                </Label>
                <p className="text-xs text-muted-foreground">Seuls les membres invités peuvent rejoindre.</p>
              </div>
              <Switch id="isInviteOnly" checked={isInviteOnly} onCheckedChange={setIsInviteOnly} />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <Label htmlFor="requireApproval" className="font-medium">
                  Approbation des Dépenses
                </Label>
                <p className="text-xs text-muted-foreground">Les admins doivent approuver les nouvelles dépenses.</p>
              </div>
              <Switch id="requireApproval" checked={requireApproval} onCheckedChange={setRequireApproval} />
            </div>
          </div>
        )}
        {currentStep === 3 && (
          <div className="space-y-5 animate-fadeIn">
            {successMessage ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="w-16 h-16 text-green-500" />
                </div>
                <h2 className="text-lg font-semibold text-green-700">Groupe créé avec succès !</h2>
                <p className="text-sm text-muted-foreground">{successMessage}</p>
                
                {inviteCode && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <h3 className="font-medium">Code d'invitation :</h3>
                    <div className="flex items-center gap-2">
                      <code className="bg-white px-3 py-2 rounded border text-lg font-mono flex-1 text-center">
                        {inviteCode}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyInviteCode}
                        className="shrink-0"
                      >
                        {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Partagez ce code avec vos amis pour qu'ils rejoignent le groupe
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <h2 className="text-base font-semibold text-gray-700">3. Finalisation</h2>
                <p className="text-sm text-muted-foreground">
                  Création du groupe en cours...
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="p-4 border-t bg-slate-50 sticky bottom-0 flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1 || isLoading || (currentStep === 3 && successMessage)}
          className="w-1/3"
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Précédent
        </Button>
        <Button
          type="button"
          onClick={nextStep}
          className="flex-1"
          disabled={
            isLoading || (currentStep === 1 && !groupName)
          }
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Création en cours..." : 
           currentStep === 2 ? "Créer le Groupe" : 
           currentStep === 3 && successMessage ? "Aller au Dashboard" : 
           "Suivant"}
          {!isLoading && currentStep < 2 && <ChevronRight className="ml-1 h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
CreateGroupScreen.defaultProps = {}
