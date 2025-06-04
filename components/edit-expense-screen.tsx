"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import { ArrowLeft, CalendarIcon, Paperclip, ChevronDown, Tag, DollarSign, Camera, Save } from "lucide-react"
import { useRouter } from "next/navigation"

const expenseCategories = ["Food", "Transport", "Accommodation", "Activities", "Shopping", "Utilities", "Other"]
const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"]

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

// Simplified ExpenseData for editing, assuming splitDetails are handled
interface ExpenseToEditData {
  id: string
  description: string
  amount: string
  currency: string
  date: string // ISO string or Date object
  category: string
  paidById: string // ID of the member who paid
  // For simplicity, we'll re-use AddExpenseScreen's split logic.
  // A real app would need to handle various existing split types.
  splitWithMemberIds: string[]
  receiptUrl?: string
  notes?: string
}

interface EditExpenseScreenProps {
  groupContext: GroupContext
  expenseToEdit: ExpenseToEditData
}

export default function EditExpenseScreen({ groupContext, expenseToEdit }: EditExpenseScreenProps) {
  const router = useRouter()
  const [description, setDescription] = useState(expenseToEdit.description)
  const [amount, setAmount] = useState(expenseToEdit.amount)
  const [currency, setCurrency] = useState(expenseToEdit.currency)
  const [date, setDate] = useState<Date | undefined>(expenseToEdit.date ? parseISO(expenseToEdit.date) : new Date())
  const [category, setCategory] = useState(expenseToEdit.category)
  const [paidBy, setPaidBy] = useState<string>(expenseToEdit.paidById)
  const [splitEqually, setSplitEqually] = useState(true) // Keep simple split logic for edit
  const [selectedMembersForSplit, setSelectedMembersForSplit] = useState<string[]>(expenseToEdit.splitWithMemberIds)
  const [receipt, setReceipt] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(expenseToEdit.receiptUrl || null)
  const [notes, setNotes] = useState(expenseToEdit.notes || "")

  useEffect(() => {
    setDescription(expenseToEdit.description)
    setAmount(expenseToEdit.amount)
    setCurrency(expenseToEdit.currency)
    setDate(expenseToEdit.date ? parseISO(expenseToEdit.date) : new Date())
    setCategory(expenseToEdit.category)
    setPaidBy(expenseToEdit.paidById)
    setSelectedMembersForSplit(expenseToEdit.splitWithMemberIds)
    setReceiptPreview(expenseToEdit.receiptUrl || null)
    setNotes(expenseToEdit.notes || "")
  }, [expenseToEdit])

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!description || !amount || !date || !category || !paidBy || selectedMembersForSplit.length === 0) {
      alert("Veuillez remplir tous les champs requis.")
      return
    }
    console.log("Expense updated (simulated):", {
      expenseId: expenseToEdit.id,
      description,
      amount,
      currency,
      date,
      category,
      paidBy,
      splitEqually,
      selectedMembersForSplit,
      receiptName: receipt ? receipt.name : "No new receipt",
      notes,
      groupId: groupContext.id,
    })
    alert("Dépense mise à jour ! (Simulation - voir console)")
    router.push(`/expense-details-example?expenseId=${expenseToEdit.id}&groupId=${groupContext.id}`)
  }

  return (
    <div className="w-full max-w-md h-[800px] max-h-[90vh] bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col">
      <header className="p-4 flex items-center border-b sticky top-0 bg-white z-10">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2"
          aria-label="Back to expense details"
          onClick={() =>
            router.push(`/expense-details-example?expenseId=${expenseToEdit.id}&groupId=${groupContext.id}`)
          }
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold text-gray-800">Modifier la Dépense</h1>
      </header>

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
            <Label htmlFor="amount">Montant</Label>
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
                  {date ? format(date, "PPP") : <span>Choisir une date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex-grow">
            <Label htmlFor="category">Catégorie</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="paidBy">Payé par</Label>
          <Select value={paidBy} onValueChange={setPaidBy}>
            <SelectTrigger id="paidBy">
              <SelectValue placeholder="Qui a payé ?" />
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
          <Label>Partagé entre</Label>
          <div className="p-3 border rounded-md">
            <div className="flex items-center justify-between mb-2">
              <Button
                type="button"
                variant="ghost"
                className="text-sm p-0 h-auto"
                onClick={() => setSplitEqually(!splitEqually)}
              >
                {splitEqually ? "Partage égal" : "Partage personnalisé (non impl.)"}
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
                  Tous ({selectedMembersForSplit.length}/{groupContext.members.length})
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
                Les options de partage personnalisé (inégal, par parts, etc.) apparaîtraient ici.
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="receiptUpload">Reçu (Optionnel)</Label>
          <div className="flex items-center gap-3">
            {receiptPreview ? (
              <img
                src={receiptPreview || "/placeholder.svg"}
                alt="Aperçu du reçu"
                className="h-16 w-16 object-cover rounded-md border"
              />
            ) : (
              <div className="h-16 w-16 bg-slate-100 rounded-md flex items-center justify-center">
                <Camera className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <Button type="button" variant="outline" onClick={() => document.getElementById("receiptUpload")?.click()}>
              <Paperclip className="mr-2 h-4 w-4" /> Joindre/Changer Reçu
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
          <Label htmlFor="notes">Notes (Optionnel)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ajouter des notes pertinentes pour cette dépense"
            className="min-h-[60px]"
          />
        </div>
      </form>

      <div className="p-4 border-t bg-slate-50 sticky bottom-0">
        <Button type="submit" onClick={handleSubmit} className="w-full h-12 text-base">
          <Save className="mr-2 h-5 w-5" />
          Sauvegarder les Modifications
        </Button>
      </div>
    </div>
  )
}

EditExpenseScreen.defaultProps = {
  groupContext: {
    id: "defaultGroup",
    name: "Default Group",
    defaultCurrency: "USD",
    members: [{ id: "defaultUser", name: "Default User (You)", isCurrentUser: true }],
  },
  expenseToEdit: {
    id: "defaultExp",
    description: "Default Expense",
    amount: "10.00",
    currency: "USD",
    date: new Date().toISOString(),
    category: "Other",
    paidById: "defaultUser",
    splitWithMemberIds: ["defaultUser"],
    notes: "Default notes",
  },
}
