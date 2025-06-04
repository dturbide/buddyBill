"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Settings,
  Users,
  PlusCircle,
  UserPlus,
  ArrowLeft,
  ListChecks,
  Scale,
  LayoutDashboard,
  Tag,
  UserCircle,
  MoreVertical,
  ArrowRightLeft,
  HandCoins,
  Camera,
  ImageIcon,
  SwitchCameraIcon as Switch,
  Trash2,
  ShieldAlert,
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ChangeEvent } from "react" // For image upload

// Define currencies array if not already available globally (for simplicity here)
const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"]

interface Member {
  id: string
  name: string
  avatarUrl?: string
  balance: string
}

interface Expense {
  id: string
  description: string
  amount: string
  currency: string
  date: string
  category: string
  paidBy: string
  paidById: string
}

interface BalanceDetail {
  from: string
  fromId: string
  to: string
  toId: string
  amount: string
  currency: string
}

interface UserOverallBalance {
  totalOwedToUser: string
  totalUserOwes: string
  netBalance: string
  currency: string
}

interface Group {
  id: string
  name: string
  imageUrl?: string
  members: Member[]
  expenses?: Expense[]
  balancesSummary?: BalanceDetail[]
  userOverallBalance?: UserOverallBalance
}

interface GroupDetailsScreenProps {
  group: Group
}

const ExpenseListItem: React.FC<{ expense: Expense; groupId?: string }> = ({ expense, groupId }) => {
  const currencySymbol = expense.currency === "EUR" ? "€" : "$"
  return (
    <Card className="mb-3 overflow-hidden shadow-sm">
      <CardHeader className="p-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base font-medium">{expense.description}</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {format(new Date(expense.date), "MMM d, yyyy")}
            </CardDescription>
          </div>
          <span className="text-lg font-semibold text-gray-700">
            {currencySymbol}
            {expense.amount}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 text-xs">
        <div className="flex items-center text-muted-foreground mb-1">
          <Tag className="h-3 w-3 mr-1.5" />
          Category: {expense.category}
        </div>
        <div className="flex items-center text-muted-foreground">
          <UserCircle className="h-3 w-3 mr-1.5" />
          Paid by: {expense.paidBy}
        </div>
      </CardContent>
      <CardFooter className="p-3 border-t bg-slate-50/50">
        {/* This button should ideally link to the ExpenseDetailsScreen */}
        <Link
          href={`/expense-details-example?expenseId=${expense.id}&groupId=${groupId || ""}`}
          passHref
          legacyBehavior
        >
          <Button asChild variant="ghost" size="sm" className="text-xs h-auto py-1 px-2 ml-auto">
            <a>
              <MoreVertical className="h-3.5 w-3.5 mr-1" /> Details
            </a>
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

const BalanceSummaryItem: React.FC<{ balance: BalanceDetail; currentUserId?: string }> = ({
  balance,
  currentUserId,
}) => {
  const currencySymbol = balance.currency === "EUR" ? "€" : "$"
  const isUserDebtor = balance.fromId === currentUserId
  const isUserCreditor = balance.toId === currentUserId

  let summaryText
  if (isUserDebtor) {
    summaryText = (
      <>
        You owe <span className="font-semibold">{balance.to}</span>
      </>
    )
  } else if (isUserCreditor) {
    summaryText = (
      <>
        <span className="font-semibold">{balance.from}</span> owes you
      </>
    )
  } else {
    summaryText = (
      <>
        <span className="font-semibold">{balance.from}</span> owes <span className="font-semibold">{balance.to}</span>
      </>
    )
  }

  return (
    <div className="flex items-center justify-between py-3 px-1 border-b last:border-b-0">
      <div className="flex items-center gap-2 text-sm">
        <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
        <span>{summaryText}</span>
      </div>
      <div className="text-sm font-semibold">
        {currencySymbol}
        {balance.amount}
      </div>
    </div>
  )
}

export default function GroupDetailsScreen({ group }: GroupDetailsScreenProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const groupExpenses = group.expenses || []
  const balancesSummary = group.balancesSummary || []
  const currentUserId = group.members.find((m) => m.name.includes("(You)"))?.id || group.members[0]?.id

  // Add state for editable fields within the Settings tab
  const [editableGroupName, setEditableGroupName] = useState(group.name)
  const [editableGroupImage, setEditableGroupImage] = useState<File | null>(null)
  const [editableGroupImagePreview, setEditableGroupImagePreview] = useState<string | null>(group.imageUrl || null)
  const [editableGroupCurrency, setEditableGroupCurrency] = useState(
    group.expenses && group.expenses.length > 0
      ? group.expenses[0].currency
      : group.userOverallBalance
        ? group.userOverallBalance.currency
        : currencies[0],
  )

  // Add new state for the advanced setting toggle
  const [requireAdminApproval, setRequireAdminApproval] = useState(false)

  const handleGroupImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0]
      setEditableGroupImage(file)
      setEditableGroupImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSaveChanges = () => {
    console.log("Saving group settings:", {
      name: editableGroupName,
      image: editableGroupImage ? editableGroupImage.name : "No new image",
      currency: editableGroupCurrency,
      adminApprovalRequired: requireAdminApproval, // Added new setting
    })
    alert("Paramètres du groupe sauvegardés (simulation - voir console).")
    // Here you would typically call an API to save the changes
  }

  // Add a new handler for removing a member (simulated)
  const handleRemoveMember = (memberId: string, memberName: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${memberName} du groupe ? Cette action est simulée.`)) {
      console.log(`Simulated removal of member: ${memberId} (${memberName})`)
      alert(`${memberName} a été supprimé (simulation).`)
      // In a real app, you'd update the group.members state or refetch data
    }
  }

  // Add handlers for danger zone actions (simulated with confirmation)
  const handleLeaveGroup = () => {
    if (confirm("Êtes-vous sûr de vouloir quitter ce groupe ? Cette action est simulée.")) {
      console.log("User chose to leave group (simulated).")
      alert("Vous avez quitté le groupe (simulation).")
      // Navigate away or update UI
    }
  }

  const handleDeleteGroup = () => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce groupe ? Cette action est irréversible et simulée.")) {
      console.log("User chose to delete group (simulated).")
      alert("Le groupe a été supprimé (simulation).")
      // Navigate away or update UI
    }
  }

  return (
    <div className="w-full max-w-md h-[800px] max-h-[90vh] bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col">
      <header className="p-4 flex items-center justify-between border-b sticky top-0 bg-white z-20">
        <Link href="/groups-list-example" passHref legacyBehavior>
          <Button variant="ghost" size="icon" className="mr-2" aria-label="Back to groups list">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3 overflow-hidden">
          <Avatar className="h-10 w-10 rounded-lg">
            <AvatarImage src={group.imageUrl || "/placeholder.svg"} alt={group.name} />
            <AvatarFallback>{group.name.substring(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <h1 className="text-lg font-semibold text-gray-800 truncate" title={group.name}>
            {group.name}
          </h1>
        </div>
        <Button variant="ghost" size="icon" aria-label="Group settings">
          <Settings className="h-5 w-5" />
        </Button>
      </header>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-600">Members ({group.members.length})</h2>
          <Link href="#" className="text-xs text-primary hover:underline">
            View All
          </Link>
        </div>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex space-x-3 pb-1">
            {group.members.slice(0, 5).map((member) => (
              <div key={member.id} className="flex flex-col items-center w-16 text-center">
                <Avatar className="h-10 w-10 mb-1">
                  <AvatarImage src={member.avatarUrl || "/placeholder.svg"} alt={member.name} />
                  <AvatarFallback>{member.name.substring(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-xs truncate w-full" title={member.name}>
                  {member.name}
                </span>
                <span
                  className={`text-xs font-medium ${member.balance.startsWith("+") ? "text-green-600" : member.balance.startsWith("-") ? "text-red-600" : "text-gray-500"}`}
                >
                  {member.balance}
                </span>
              </div>
            ))}
            {group.members.length > 5 && (
              <div className="flex flex-col items-center justify-center w-16 text-center">
                <Avatar className="h-10 w-10 mb-1 bg-slate-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-slate-500" />
                </Avatar>
                <span className="text-xs text-slate-600">+{group.members.length - 5} more</span>
              </div>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-grow">
        <TabsList className="grid w-full grid-cols-4 rounded-none border-b h-auto px-2 pt-1">
          <TabsTrigger value="overview" className="py-2.5 text-xs sm:text-sm">
            <LayoutDashboard className="h-4 w-4 mr-1.5 sm:mr-2" /> Overview
          </TabsTrigger>
          <TabsTrigger value="expenses" className="py-2.5 text-xs sm:text-sm">
            <ListChecks className="h-4 w-4 mr-1.5 sm:mr-2" /> Expenses
          </TabsTrigger>
          <TabsTrigger value="balances" className="py-2.5 text-xs sm:text-sm">
            <Scale className="h-4 w-4 mr-1.5 sm:mr-2" /> Balances
          </TabsTrigger>
          <TabsTrigger value="settings_tab" className="py-2.5 text-xs sm:text-sm">
            <Settings className="h-4 w-4 mr-1.5 sm:mr-2" /> Settings
          </TabsTrigger>
        </TabsList>
        <div className="flex-grow overflow-y-auto bg-slate-50">
          <TabsContent value="overview" className="p-4">
            <h3 className="text-lg font-semibold mb-3">Group Overview</h3>
            {group.userOverallBalance && (
              <Card className="mb-4 shadow-sm">
                <CardHeader className="pb-2 pt-3">
                  <CardTitle className="text-base">Your Balance Summary</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1 pb-3">
                  <div className="flex justify-between">
                    <span>Total owed to you:</span>
                    <span className="font-medium text-green-600">
                      {group.userOverallBalance.currency === "EUR" ? "€" : "$"}
                      {group.userOverallBalance.totalOwedToUser}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total you owe:</span>
                    <span className="font-medium text-red-600">
                      {group.userOverallBalance.currency === "EUR" ? "€" : "$"}
                      {group.userOverallBalance.totalUserOwes}
                    </span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between text-base">
                    <span className="font-semibold">Net Balance:</span>
                    <span
                      className={`font-bold ${group.userOverallBalance.netBalance.startsWith("+") ? "text-green-700" : "text-red-700"}`}
                    >
                      {group.userOverallBalance.currency === "EUR" ? "€" : "$"}
                      {group.userOverallBalance.netBalance}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
            <p className="text-muted-foreground text-sm">
              Recent activity and other summaries for {group.name} will be shown here.
            </p>
          </TabsContent>
          <TabsContent value="expenses" className="p-4">
            {groupExpenses.length > 0 ? (
              groupExpenses.map((expense) => <ExpenseListItem key={expense.id} expense={expense} groupId={group.id} />)
            ) : (
              <div className="text-center py-10">
                <ListChecks className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-muted-foreground">No expenses recorded in this group yet.</p>
                <p className="text-sm text-muted-foreground">Click &quot;Add Expense&quot; below to get started.</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="balances" className="p-4">
            <h3 className="text-lg font-semibold mb-3">Group Balances</h3>
            {balancesSummary.length > 0 ? (
              <Card className="shadow-sm">
                <CardContent className="p-0">
                  {balancesSummary.map((balance, index) => (
                    <BalanceSummaryItem key={index} balance={balance} currentUserId={currentUserId} />
                  ))}
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-10">
                <Scale className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-muted-foreground">All balances are settled, or no expenses yet.</p>
                <p className="text-sm text-muted-foreground">Add expenses to see balances here.</p>
              </div>
            )}
            {group.userOverallBalance && (
              <Card className="mt-4 shadow-sm">
                <CardHeader className="pb-2 pt-3">
                  <CardTitle className="text-base">Your Net Balance in Group</CardTitle>
                </CardHeader>
                <CardContent className="text-lg font-bold pb-3">
                  <span
                    className={`${group.userOverallBalance.netBalance.startsWith("+") ? "text-green-700" : "text-red-700"}`}
                  >
                    {group.userOverallBalance.currency === "EUR" ? "€" : "$"}
                    {group.userOverallBalance.netBalance}
                  </span>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="settings_tab" className="p-4 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Modifier les informations du groupe</h3>
              <Card className="shadow-sm">
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label htmlFor="groupNameEdit">Nom du groupe</Label>
                    <Input
                      id="groupNameEdit"
                      value={editableGroupName}
                      onChange={(e) => setEditableGroupName(e.target.value)}
                      placeholder="Nom du groupe"
                    />
                  </div>
                  <div>
                    <Label>Image du groupe</Label>
                    <div className="flex items-center gap-4 mt-1">
                      <Avatar className="h-20 w-20 rounded-lg border">
                        <AvatarImage
                          src={editableGroupImagePreview || "/placeholder.svg?width=80&height=80&query=group+icon"}
                          alt="Aperçu de l'image du groupe"
                        />
                        <AvatarFallback>
                          <ImageIcon className="h-10 w-10 text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("groupImageEditUpload")?.click()}
                      >
                        <Camera className="mr-2 h-4 w-4" /> Changer l'image
                      </Button>
                      <Input
                        type="file"
                        id="groupImageEditUpload"
                        accept="image/*"
                        onChange={handleGroupImageChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="groupCurrencyEdit">Devise par défaut du groupe</Label>
                    <Select value={editableGroupCurrency} onValueChange={setEditableGroupCurrency}>
                      <SelectTrigger id="groupCurrencyEdit">
                        <SelectValue placeholder="Sélectionner une devise" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Affecte les nouvelles dépenses. Les dépenses existantes ne sont pas modifiées.
                    </p>
                  </div>
                  <Button onClick={handleSaveChanges} className="w-full sm:w-auto">
                    Sauvegarder les modifications
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Gestion des membres - Updated Card */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Gestion des membres</h3>
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3">
                  <CardTitle className="text-base">Membres actuels ({group.members.length})</CardTitle>
                  <Button variant="outline" size="sm">
                    <UserPlus className="mr-2 h-4 w-4" /> Inviter
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[150px]">
                    {/* Added ScrollArea for member list */}
                    <div className="divide-y">
                      {group.members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={member.avatarUrl || "/placeholder.svg?width=32&height=32"}
                                alt={member.name}
                              />
                              <AvatarFallback>{member.name.substring(0, 1)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{member.name}</span>
                          </div>
                          {/* Don't allow removing the current user (example logic) */}
                          {member.id !== currentUserId && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => handleRemoveMember(member.id, member.name)}
                              aria-label={`Supprimer ${member.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Paramètres avancés - Updated Card */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Paramètres avancés</h3>
              <Card className="shadow-sm">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <Label htmlFor="requireAdminApproval" className="font-medium">
                        Approbation Admin pour Dépenses
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Si activé, seuls les admins peuvent approuver les nouvelles dépenses.
                      </p>
                    </div>
                    <Switch
                      id="requireAdminApproval"
                      checked={requireAdminApproval}
                      onCheckedChange={setRequireAdminApproval}
                    />
                  </div>
                  {/* Add other advanced settings here */}
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Zone de danger - Updated Card */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-red-600 flex items-center">
                <ShieldAlert className="h-5 w-5 mr-2" /> Zone de danger
              </h3>
              <Card className="shadow-sm border-red-200 bg-red-50/30">
                <CardContent className="p-4 space-y-3">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto text-amber-700 border-amber-400 hover:bg-amber-100 hover:border-amber-500"
                    onClick={handleLeaveGroup}
                  >
                    Quitter le groupe
                  </Button>
                  <Button variant="destructive" className="w-full sm:w-auto" onClick={handleDeleteGroup}>
                    Supprimer le groupe
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Ces actions sont irréversibles. Soyez certain avant de continuer.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </div>
      </Tabs>
      <div className="p-3 border-t bg-slate-100 grid grid-cols-4 gap-2 sticky bottom-0 z-10">
        <Link href={`/add-expense-example?groupId=${group.id}`} passHref legacyBehavior>
          <Button asChild variant="outline" size="sm" className="flex flex-col h-auto items-center py-1.5 px-1 text-xs">
            <a>
              <PlusCircle className="h-5 w-5 mb-0.5" /> Add Expense
            </a>
          </Button>
        </Link>
        <Link href={`/settle-up-example?groupId=${group.id}`} passHref legacyBehavior>
          <Button asChild variant="outline" size="sm" className="flex flex-col h-auto items-center py-1.5 px-1 text-xs">
            <a>
              <HandCoins className="h-5 w-5 mb-0.5" /> Settle Up
            </a>
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          className="flex flex-col h-auto items-center py-1.5 px-1 text-xs"
          onClick={() => setActiveTab("balances")}
        >
          <Scale className="h-5 w-5 mb-0.5" /> View Balances
        </Button>
        <Button variant="outline" size="sm" className="flex flex-col h-auto items-center py-1.5 px-1 text-xs">
          <UserPlus className="h-5 w-5 mb-0.5" /> Invite
        </Button>
      </div>
    </div>
  )
}
GroupDetailsScreen.defaultProps = {
  group: {
    id: "default",
    name: "Default Group",
    imageUrl: "/placeholder.svg?width=80&height=80",
    members: [{ id: "m1", name: "User 1", avatarUrl: "/placeholder.svg?width=40&height=40", balance: "€0.00" }],
    expenses: [],
    balancesSummary: [],
    userOverallBalance: { totalOwedToUser: "0.00", totalUserOwes: "0.00", netBalance: "0.00", currency: "EUR" },
  },
}
