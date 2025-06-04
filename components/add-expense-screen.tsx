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
import { format } from "date-fns"
import { ArrowLeft, CalendarIcon, Paperclip, ChevronDown, Tag, DollarSign, Camera } from "lucide-react"
import Link from "next/link"

const expenseCategories = ["Food", "Transport", "Accommodation", "Activities", "Shopping", "Utilities", "Other"]
const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"] // Should ideally come from a config or API

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

  useEffect(() => {
    setCurrency(groupContext.defaultCurrency)
    setPaidBy(groupContext.members.find((m) => m.isCurrentUser)?.id || groupContext.members[0]?.id || "")
    setSelectedMembersForSplit(groupContext.members.map((m) => m.id))
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Basic validation
    if (!description || !amount || !date || !category || !paidBy || selectedMembersForSplit.length === 0) {
      alert("Please fill in all required fields.")
      return
    }
    console.log("Expense submitted:", {
      description,
      amount,
      currency,
      date,
      category,
      paidBy,
      splitEqually,
      selectedMembersForSplit,
      receipt,
      notes,
      groupId: groupContext.id,
    })
    alert("Expense added! (See console for data)")
    // Potentially redirect or clear form
  }

  return (
    <div className="w-full max-w-md h-[800px] max-h-[90vh] bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center border-b sticky top-0 bg-white z-10">
        <Link href={`/group-details-example?groupId=${groupContext.id}`} passHref legacyBehavior>
          <Button variant="ghost" size="icon" className="mr-2" aria-label="Back to group">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold text-gray-800">Add Expense to {groupContext.name}</h1>
      </header>

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
          <div className="w-1/3">
            <Label htmlFor="currency">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select currency" />
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
        <Button type="submit" onClick={handleSubmit} className="w-full h-12 text-base">
          Add Expense
        </Button>
      </div>
    </div>
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
