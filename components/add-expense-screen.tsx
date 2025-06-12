"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ArrowLeft, CalendarIcon, Paperclip, ChevronDown, Tag, DollarSign, Camera, Upload, Plus, Minus, Calculator, X, WifiOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useNotifications } from '@/components/notification-system'
import { AppLayout, MobileCard } from '@/components/app-layout'
import { ALL_CURRENCIES, getCurrencyByCode, formatCurrencyAmount, POPULAR_CURRENCIES } from '@/lib/currencies'
import { useOfflineExpenses } from '@/hooks/use-offline-expenses'
import { toast } from 'sonner'

interface Member {
  id: string
  name: string
  isCurrentUser?: boolean
  avatarUrl?: string
}

interface GroupContext {
  id: string
  name: string
  defaultCurrency: string
  members: Member[]
}

interface AddExpenseScreenProps {
  groupContext: GroupContext
}

export default function AddExpenseScreen({ groupContext }: AddExpenseScreenProps) {
  const router = useRouter()
  const notifications = useNotifications()
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState(groupContext.defaultCurrency)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [category, setCategory] = useState("")
  const [paidBy, setPaidBy] = useState<string>(
    groupContext.members.find((m) => m.isCurrentUser)?.id || groupContext.members[0]?.id || "",
  )
  const [splitEqually, setSplitEqually] = useState(true) // Simplified split logic for now
  const [selectedMembersForSplit, setSelectedMembersForSplit] = useState<string[]>(
    groupContext.members.map((m) => m.id),
  )
  const [receipt, setReceipt] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [categories, setCategories] = useState<{id: string, name: string, icon: string}[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchCurrency, setSearchCurrency] = useState("")
  const { createExpense, isCreating, isOnline } = useOfflineExpenses()

  // Filtrer les devises
  const filteredCurrencies = ALL_CURRENCIES.filter((curr) =>
    curr.code.toLowerCase().includes(searchCurrency.toLowerCase()) ||
    curr.name.toLowerCase().includes(searchCurrency.toLowerCase())
  )

  useEffect(() => {
    setCurrency(groupContext.defaultCurrency)
    setPaidBy(groupContext.members.find((m) => m.isCurrentUser)?.id || groupContext.members[0]?.id || "")
    setSelectedMembersForSplit(groupContext.members.map((m) => m.id))
    
    // Récupérer les catégories depuis la base de données
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        const result = await response.json()
        if (result.success && result.data) {
          setCategories(result.data)
        } else {
          // Fallback avec catégories par défaut
          setCategories([
            { id: '1', name: 'Alimentation', icon: '🍕' },
            { id: '2', name: 'Transport', icon: '🚗' },
            { id: '3', name: 'Divertissement', icon: '🎬' },
            { id: '4', name: 'Logement', icon: '🏠' },
            { id: '5', name: 'Autre', icon: '💰' }
          ])
        }
      } catch (error) {
        console.error('Erreur récupération catégories:', error)
        // Fallback avec catégories par défaut
        setCategories([
          { id: '1', name: 'Alimentation', icon: '🍕' },
          { id: '2', name: 'Transport', icon: '🚗' },
          { id: '3', name: 'Divertissement', icon: '🎬' },
          { id: '4', name: 'Logement', icon: '🏠' },
          { id: '5', name: 'Autre', icon: '💰' }
        ])
      }
    }
    
    fetchCategories()
  }, [groupContext])

  const handleReceiptChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0]
      setReceipt(file)
      setReceiptPreview(URL.createObjectURL(file))
    }
  }

  const toggleMemberForSplit = (memberId: string) => {
    setSelectedMembersForSplit((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId],
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!description.trim() || !amount || parseFloat(amount) <= 0) {
      notifications.showError("Champs requis", "Veuillez remplir tous les champs obligatoires.")
      return
    }

    if (selectedMembersForSplit.length === 0) {
      notifications.showError("Aucun participant", "Veuillez sélectionner au moins un participant pour partager cette dépense.")
      return
    }

    setIsSubmitting(true)

    try {
      // Utiliser le hook offline-first pour créer la dépense
      const result = await createExpense({
        group_id: groupContext.id,
        description: description.trim(),
        amount: parseFloat(amount),
        currency: currency,
        paid_by: paidBy,
        expense_date: date?.toISOString() || new Date().toISOString(),
        participants: selectedMembersForSplit,
        category: category,
        notes: notes.trim()
      })

      if (result.success) {
        // Afficher le message approprié selon le mode (online/offline)
        if (result.isOffline) {
          toast.info('Dépense créée hors-ligne. Elle sera synchronisée automatiquement.', {
            description: 'Votre dépense a été sauvegardée localement.',
            action: {
              label: 'Voir le statut',
              onClick: () => console.log('Voir statut offline')
            }
          })
        } else {
          notifications.showSuccess("Dépense ajoutée", "La dépense a été ajoutée avec succès au groupe.")
        }
        
        // Réinitialiser le formulaire
        setDescription("")
        setAmount("")
        setNotes("")
        setReceipt(null)
        setReceiptPreview(null)
        setDate(new Date())
        
        // Rediriger vers la liste des dépenses après un délai
        setTimeout(() => {
          router.push(`/groups/${groupContext.id}/expenses`)
        }, 1500)
      } else {
        notifications.showError("Erreur", result.error || "Impossible de créer la dépense")
      }
    } catch (error) {
      console.error('Erreur lors de la création de la dépense:', error)
      notifications.showError("Erreur inattendue", "Une erreur inattendue s'est produite. Veuillez réessayer.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppLayout title="Ajouter une dépense" showBackButton={true} backHref="/dashboard">
      <MobileCard>
        {/* Form Area (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-5">
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Dinner, Taxi, Groceries"
              required
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-grow">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="pl-8"
                />
              </div>
            </div>
            <div className="w-1/3 space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <div className="space-y-1">
                <Input
                  placeholder="Search currency..."
                  value={searchCurrency}
                  onChange={(e) => setSearchCurrency(e.target.value)}
                  className="text-xs h-8"
                />
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency" className="h-9">
                    <SelectValue>
                      {getCurrencyByCode(currency)?.flag} {currency}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-40 overflow-y-auto">
                    {/* Devises populaires en premier si pas de recherche */}
                    {!searchCurrency && (
                      <>
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Popular</div>
                        {POPULAR_CURRENCIES.map((curr) => (
                          <SelectItem key={curr.code} value={curr.code}>
                            <span className="flex items-center gap-2">
                              <span>{curr.flag}</span>
                              <span>{curr.code}</span>
                              <span className="text-muted-foreground text-xs">{curr.symbol}</span>
                            </span>
                          </SelectItem>
                        ))}
                        <div className="border-t my-1"></div>
                      </>
                    )}
                    {/* Devises filtrées */}
                    {filteredCurrencies
                      .filter(curr => searchCurrency ? true : !curr.popular)
                      .slice(0, 30)
                      .map((curr) => (
                        <SelectItem key={curr.code} value={curr.code}>
                          <span className="flex items-center gap-2">
                            <span>{curr.flag}</span>
                            <span>{curr.code}</span>
                            <span className="text-muted-foreground text-xs">{curr.symbol}</span>
                          </span>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-grow">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex-grow">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="paidBy">Paid by</Label>
            <Select value={paidBy} onValueChange={setPaidBy}>
              <SelectTrigger id="paidBy">
                <SelectValue placeholder="Select who paid" />
              </SelectTrigger>
              <SelectContent>
                {groupContext.members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center">
                      <Avatar className="h-5 w-5 mr-2">
                        <AvatarImage src={member.avatarUrl || "/placeholder.svg"} alt={member.name} />
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
            <Label>Split between</Label>
            <div className="p-3 border rounded-md">
              <div className="flex items-center justify-between mb-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-sm p-0 h-auto"
                  onClick={() => setSplitEqually(!splitEqually)} // Toggle for demo, real app needs more options
                >
                  {splitEqually ? "Split equally" : "Custom split (not implemented)"}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="selectAllMembers"
                    checked={selectedMembersForSplit.length === groupContext.members.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedMembersForSplit(groupContext.members.map((m) => m.id))
                      } else {
                        setSelectedMembersForSplit([])
                      }
                    }}
                  />
                  <Label htmlFor="selectAllMembers" className="text-sm font-normal">
                    All ({selectedMembersForSplit.length}/{groupContext.members.length})
                  </Label>
                </div>
              </div>
              {splitEqually && (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {groupContext.members.map((member) => (
                    <div key={member.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`member-${member.id}`}
                        checked={selectedMembersForSplit.includes(member.id)}
                        onCheckedChange={() => toggleMemberForSplit(member.id)}
                      />
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={member.avatarUrl || "/placeholder.svg"} alt={member.name} />
                        <AvatarFallback>{member.name.substring(0, 1)}</AvatarFallback>
                      </Avatar>
                      <Label htmlFor={`member-${member.id}`} className="text-sm font-normal flex-grow">
                        {member.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
              {!splitEqually && (
                <p className="text-sm text-muted-foreground">
                  Custom split options (unequally, by shares, etc.) would appear here.
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="receiptUpload">Receipt (Optional)</Label>
            <div className="flex items-center gap-3">
              {receiptPreview ? (
                <img
                  src={receiptPreview || "/placeholder.svg"}
                  alt="Receipt preview"
                  className="h-16 w-16 object-cover rounded-md border"
                />
              ) : (
                <div className="h-16 w-16 bg-slate-100 rounded-md flex items-center justify-center">
                  <Camera className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <Button type="button" variant="outline" onClick={() => document.getElementById("receiptUpload")?.click()}>
                <Paperclip className="mr-2 h-4 w-4" /> Attach Receipt
              </Button>
              <Input
                type="file"
                id="receiptUpload"
                accept="image/*,application/pdf"
                onChange={handleReceiptChange}
                className="hidden"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any relevant notes for this expense"
              className="min-h-[60px]"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-slate-50 sticky bottom-0">
          <Button type="submit" onClick={handleSubmit} className="w-full h-12 text-base" disabled={isSubmitting}>
            {isSubmitting ? "Adding expense..." : "Add Expense"}
          </Button>
        </div>
      </MobileCard>
    </AppLayout>
  )
}

AddExpenseScreen.defaultProps = {
  groupContext: {
    id: "defaultGroup",
    name: "Default Group",
    defaultCurrency: "USD",
    members: [{ id: "defaultUser", name: "Default User (You)", isCurrentUser: true }],
  },
}
