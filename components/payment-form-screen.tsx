"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/app-layout'
import { MobileCard } from '@/components/mobile-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { CalendarIcon, Send, Repeat, DollarSign, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

const currencies = ["EUR", "USD", "GBP", "CAD", "AUD", "JPY"]

interface Member {
  id: string
  name: string
  isCurrentUser?: boolean
}

interface Group {
  id: string
  name: string
  currency: string
  members: Member[]
}

export default function PaymentFormScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // États du formulaire
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string>('direct')
  const [payerId, setPayerId] = useState<string>('')
  const [payeeId, setPayeeId] = useState<string>('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [description, setDescription] = useState('')
  
  // États de l'interface
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<Member | null>(null)

  // Charger les groupes et l'utilisateur au montage
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        // Charger les groupes
        const groupsResponse = await fetch('/api/groups')
        const groupsResult = await groupsResponse.json()
        
        if (!groupsResponse.ok) {
          throw new Error(groupsResult.error || 'Erreur chargement groupes')
        }

        if (groupsResult.success && groupsResult.data) {
          setGroups(groupsResult.data)
          
          // Définir l'utilisateur actuel à partir du premier groupe
          if (groupsResult.data.length > 0) {
            const firstGroup = groupsResult.data[0]
            const currentUserMember = firstGroup.members?.find((m: Member) => m.isCurrentUser)
            if (currentUserMember) {
              setCurrentUser(currentUserMember)
              setPayerId(currentUserMember.id)
            }
          }
        }

        // Traiter les paramètres de recherche
        const groupIdParam = searchParams.get('groupId')
        const payeeIdParam = searchParams.get('payeeId')
        
        if (groupIdParam) {
          setSelectedGroupId(groupIdParam)
          const selectedGroup = groupsResult.data?.find((g: Group) => g.id === groupIdParam)
          if (selectedGroup) {
            setCurrency(selectedGroup.currency)
          }
        }
        
        if (payeeIdParam) {
          setPayeeId(payeeIdParam)
        }

      } catch (err) {
        console.error('Erreur chargement données:', err)
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [searchParams])

  // Mettre à jour les utilisateurs disponibles quand le groupe change
  const selectedGroup = selectedGroupId && selectedGroupId !== 'direct' ? groups.find(g => g.id === selectedGroupId) : null
  const availableMembers = selectedGroup?.members || []
  const availablePayers = availableMembers
  const availablePayees = availableMembers.filter(m => m.id !== payerId)

  // Gérer l'échange payeur/bénéficiaire
  const handleSwapPayerPayee = () => {
    const tempPayerId = payerId
    setPayerId(payeeId)
    setPayeeId(tempPayerId)
  }

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!payerId || !payeeId || !amount || !date) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }
    
    if (payerId === payeeId) {
      toast.error('Le payeur et le bénéficiaire ne peuvent pas être la même personne')
      return
    }

    try {
      setSubmitting(true)
      
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId: selectedGroupId && selectedGroupId !== 'direct' ? selectedGroupId : null,
          payerId,
          payeeId,
          amount: parseFloat(amount),
          currency,
          description: description || null,
          paymentDate: date.toISOString()
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'enregistrement')
      }

      if (result.success) {
        toast.success('Paiement enregistré avec succès !')
        router.push('/dashboard/settle-up')
      } else {
        throw new Error(result.error || 'Erreur API')
      }

    } catch (err) {
      console.error('Erreur soumission paiement:', err)
      toast.error(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <AppLayout title="Enregistrer un paiement" showBackButton backHref="/dashboard/settle-up">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout title="Enregistrer un paiement" showBackButton backHref="/dashboard/settle-up">
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Réessayer
          </Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Enregistrer un paiement" showBackButton backHref="/dashboard/settle-up">
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        
        {/* Sélection du groupe (optionnel) */}
        <MobileCard>
          <div className="p-4">
            <Label htmlFor="group">Groupe (optionnel)</Label>
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger id="group">
                <SelectValue placeholder="Choisir un groupe ou laisser vide pour un paiement direct" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="direct">Paiement direct (sans groupe)</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </MobileCard>

        {/* Sélection payeur et bénéficiaire */}
        <MobileCard>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Participants</h3>
              {payerId && payeeId && payerId !== payeeId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSwapPayerPayee}
                >
                  <Repeat className="w-4 h-4 mr-1" />
                  Échanger
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="payer">Payeur</Label>
                <Select value={payerId} onValueChange={setPayerId}>
                  <SelectTrigger id="payer">
                    <SelectValue placeholder="Qui paie ?" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePayers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center">
                          <Avatar className="h-5 w-5 mr-2">
                            <AvatarFallback>{member.name.substring(0, 1)}</AvatarFallback>
                          </Avatar>
                          {member.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="payee">Bénéficiaire</Label>
                <Select value={payeeId} onValueChange={setPayeeId}>
                  <SelectTrigger id="payee">
                    <SelectValue placeholder="Qui reçoit ?" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePayees.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center">
                          <Avatar className="h-5 w-5 mr-2">
                            <AvatarFallback>{member.name.substring(0, 1)}</AvatarFallback>
                          </Avatar>
                          {member.name}
                        </div>
                      </SelectItem>
                    ))}
                    {availablePayees.length === 0 && (
                      <div className="p-2 text-sm text-muted-foreground">
                        Sélectionnez d'abord un payeur ou choisissez un groupe
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {payerId === payeeId && payerId !== "" && (
              <p className="text-xs text-red-500">Le payeur et le bénéficiaire ne peuvent pas être identiques.</p>
            )}
          </div>
        </MobileCard>

        {/* Montant et devise */}
        <MobileCard>
          <div className="p-4">
            <div className="flex gap-3">
              <div className="flex-grow">
                <Label htmlFor="amount">Montant</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="w-1/3">
                <Label htmlFor="currency">Devise</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Devise" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((curr) => (
                      <SelectItem key={curr} value={curr}>
                        {curr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </MobileCard>

        {/* Date et description */}
        <MobileCard>
          <div className="p-4 space-y-4">
            <div>
              <Label htmlFor="date">Date du paiement</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Choisir une date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ex: Remboursement dîner, Règlement tickets..."
                className="min-h-[80px]"
              />
            </div>
          </div>
        </MobileCard>

        {/* Bouton de soumission */}
        <div className="sticky bottom-4">
          <Button
            type="submit"
            className="w-full h-12 text-base"
            disabled={!payerId || !payeeId || payerId === payeeId || !amount || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Enregistrer le paiement
              </>
            )}
          </Button>
        </div>
      </form>
    </AppLayout>
  )
}
