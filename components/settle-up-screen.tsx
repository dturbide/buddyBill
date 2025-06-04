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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ArrowLeft, CalendarIcon, Send, Repeat, DollarSign } from "lucide-react"
import Link from "next/link"

const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"]

interface Member {
  id: string
  name: string
  isCurrentUser?: boolean
  avatarUrl?: string
}

interface GroupContext {
  id: string // Can be group ID or null if settling outside a specific group
  name?: string // Group name, optional
  members: Member[] // Members involved, could be just two for a direct payment
  defaultCurrency: string
}

interface SettleUpScreenProps {
  groupContext: GroupContext // Context can be a group or just a list of users
  // We might also pass pre-filled payer/payee IDs if navigating from a specific balance
}

export default function SettleUpScreen({ groupContext }: SettleUpScreenProps) {
  const currentUser = groupContext.members.find((m) => m.isCurrentUser) || groupContext.members[0]
  const otherMembers = groupContext.members.filter((m) => m.id !== currentUser?.id)

  const [payerId, setPayerId] = useState<string>(currentUser?.id || "")
  const [payeeId, setPayeeId] = useState<string>(otherMembers[0]?.id || "")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState(groupContext.defaultCurrency)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [notes, setNotes] = useState("")

  useEffect(() => {
    // Ensure payer and payee are different if possible
    if (payerId === payeeId && otherMembers.length > 0) {
      if (payerId === currentUser?.id) {
        setPayeeId(otherMembers[0].id)
      } else {
        setPayerId(currentUser?.id || otherMembers[0].id) // Fallback if currentUser is not payer
      }
    }
  }, [payerId, payeeId, currentUser, otherMembers])

  const handleSwapPayerPayee = () => {
    const tempPayerId = payerId
    setPayerId(payeeId)
    setPayeeId(tempPayerId)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!payerId || !payeeId || !amount || !date) {
      alert("Please fill in all required fields.")
      return
    }
    if (payerId === payeeId) {
      alert("Payer and payee cannot be the same person.")
      return
    }
    console.log("Payment submitted:", {
      payerId,
      payeeId,
      amount,
      currency,
      date,
      notes,
      groupId: groupContext.id, // Could be null if not group-specific
    })
    alert("Payment recorded! (See console for data)")
  }

  const availablePayers = groupContext.members
  const availablePayees = groupContext.members.filter((m) => m.id !== payerId)

  return (
    <div className="w-full max-w-md h-[800px] max-h-[90vh] bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col">
      <header className="p-4 flex items-center border-b sticky top-0 bg-white z-10">
        <Link
          href={groupContext.id ? `/group-details-example?groupId=${groupContext.id}` : "/dashboard-example"}
          passHref
          legacyBehavior
        >
          <Button variant="ghost" size="icon" className="mr-2" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold text-gray-800">
          Record Payment {groupContext.name ? `in ${groupContext.name}` : ""}
        </h1>
      </header>

      <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1">
            <Label htmlFor="payer">Who paid?</Label>
            <Select value={payerId} onValueChange={setPayerId}>
              <SelectTrigger id="payer">
                <SelectValue placeholder="Select payer" />
              </SelectTrigger>
              <SelectContent>
                {availablePayers.map((member) => (
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

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleSwapPayerPayee}
            className="mt-6"
            aria-label="Swap payer and payee"
          >
            <Repeat className="h-5 w-5 text-primary" />
          </Button>

          <div className="flex-1">
            <Label htmlFor="payee">To whom?</Label>
            <Select value={payeeId} onValueChange={setPayeeId}>
              <SelectTrigger id="payee">
                <SelectValue placeholder="Select payee" />
              </SelectTrigger>
              <SelectContent>
                {/* Filter out the current payer from payee list */}
                {groupContext.members
                  .filter((m) => m.id !== payerId)
                  .map((member) => (
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
                {groupContext.members.filter((m) => m.id !== payerId).length === 0 && (
                  <div className="p-2 text-sm text-muted-foreground">Select a payer first or add more members.</div>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {payerId === payeeId && payerId !== "" && (
          <p className="text-xs text-red-500">Payer and payee cannot be the same.</p>
        )}

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
                <SelectValue placeholder="Currency" />
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

        <div>
          <Label htmlFor="date">Date of Payment</Label>
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

        <div>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Settled for dinner, Reimbursement for tickets"
            className="min-h-[80px]"
          />
        </div>
      </form>

      <div className="p-4 border-t bg-slate-50 sticky bottom-0">
        <Button
          type="submit"
          onClick={handleSubmit}
          className="w-full h-12 text-base"
          disabled={!payerId || !payeeId || payerId === payeeId || !amount}
        >
          <Send className="mr-2 h-5 w-5" /> Record Payment
        </Button>
      </div>
    </div>
  )
}

SettleUpScreen.defaultProps = {
  groupContext: {
    id: "defaultGroup",
    name: "Default Group",
    members: [
      { id: "user1", name: "User One (You)", isCurrentUser: true, avatarUrl: "/placeholder.svg?width=40&height=40" },
      { id: "user2", name: "User Two", isCurrentUser: false, avatarUrl: "/placeholder.svg?width=40&height=40" },
    ],
    defaultCurrency: "USD",
  },
}
