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
import { ArrowLeft, Camera, Check, ChevronRight, ChevronLeft, ImageIcon, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createGroupAction } from "@/app/actions/group-actions" // Import Server Action
// Note: Supabase client for image upload would be needed here if doing direct-to-storage uploads
// For simplicity, we'll assume image_url is handled or passed as a string for now.

const groupTypes = ["Voyage", "Colocataires", "Amis", "Événement", "Projet", "Autre"]
const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"]

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
  const [defaultCurrency, setDefaultCurrency] = useState(currencies[0])
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
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      // Final step: submit group creation
      setIsLoading(true)
      const result = await createGroupAction({
        groupName,
        groupDescription,
        groupType,
        groupImagePreview, // Pass preview URL; real app: pass URL from Supabase Storage
        defaultCurrency,
        isInviteOnly,
        requireApproval,
      })
      setIsLoading(false)
      if (result.success) {
        setSuccessMessage(result.message || "Groupe créé avec succès !")
        // alert("Groupe créé avec succès ! Redirection...")
        setTimeout(() => router.push("/groups-list-example"), 1500)
      } else {
        setError(result.error || "Erreur lors de la création du groupe.")
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const progressValue = (currentStep / totalSteps) * 100

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
          <div className="p-3 mb-4 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-center">
            <Check className="h-5 w-5 mr-2 flex-shrink-0" />
            <p className="text-sm text-left">{successMessage}</p>
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
            <div>
              <Label htmlFor="defaultCurrency">Devise par Défaut</Label>
              <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
                <SelectTrigger id="defaultCurrency">
                  <SelectValue placeholder="Sélectionner devise" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <h2 className="text-base font-semibold text-gray-700">3. Ajouter des Membres (Optionnel)</h2>
            <p className="text-sm text-muted-foreground">
              Vous pourrez ajouter des membres après la création du groupe. Cette étape est pour l'instant une maquette.
            </p>
            {/* La logique d'ajout de membres sera plus complexe et gérée après la création du groupe */}
          </div>
        )}
      </div>
      <div className="p-4 border-t bg-slate-50 sticky bottom-0 flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1 || isLoading}
          className="w-1/3"
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Précédent
        </Button>
        <Button
          type="button"
          onClick={nextStep}
          className="flex-1"
          disabled={
            isLoading || (currentStep === 1 && !groupName) || (currentStep === totalSteps && successMessage !== null)
          }
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Traitement..." : currentStep === totalSteps ? "Créer le Groupe" : "Suivant"}
          {!isLoading && currentStep < totalSteps && <ChevronRight className="ml-1 h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
CreateGroupScreen.defaultProps = {}
