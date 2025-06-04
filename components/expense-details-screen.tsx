"use client"
import type React from "react" // Added React import
import { useState } from "react" // Added useState
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea" // Added Textarea
import {
  ArrowLeft,
  CalendarDays,
  Tag,
  Users,
  Paperclip,
  Edit3,
  Trash2,
  UserCircle,
  StickyNote,
  Landmark,
  MessageSquare,
  Send,
} from "lucide-react"
import Link from "next/link"
import { format, formatDistanceToNow, parseISO } from "date-fns" // Added formatDistanceToNow
import { fr } from "date-fns/locale" // Added fr locale
import { useRouter } from "next/navigation"
import type { Comment } from "@/lib/dummy-data" // Import Comment type
import { DUMMY_CURRENT_USER } from "@/lib/dummy-data" // Import current user for posting comments

interface MemberInfo {
  id: string
  name: string
  avatarUrl?: string
}

interface SplitDetail {
  member: MemberInfo
  share: string
  owes: string
}

interface ExpenseData {
  id: string
  description: string
  amount: string
  currency: string
  date: string
  category: string
  paidBy: MemberInfo
  group?: { id: string; name: string }
  splitDetails: SplitDetail[]
  receiptUrl?: string
  notes?: string
  comments?: Comment[] // Added comments field
}

interface ExpenseDetailsScreenProps {
  expense: ExpenseData
}

// Sub-component for rendering a single comment
const CommentItem: React.FC<{ comment: Comment }> = ({ comment }) => {
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-b-0">
      <Avatar className="h-8 w-8">
        <AvatarImage src={comment.author.avatarUrl || "/placeholder.svg"} alt={comment.author.name} />
        <AvatarFallback>{comment.author.name.substring(0, 1)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{comment.author.name}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(parseISO(comment.timestamp), { addSuffix: true, locale: fr })}
          </span>
        </div>
        <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap">{comment.text}</p>
      </div>
    </div>
  )
}

export default function ExpenseDetailsScreen({ expense: initialExpense }: ExpenseDetailsScreenProps) {
  const currencySymbol = initialExpense.currency === "EUR" ? "€" : "$"
  const router = useRouter()
  const [newComment, setNewComment] = useState("")
  // Manage expense state locally to update comments optimistically
  const [expense, setExpense] = useState(initialExpense)

  const handleDeleteExpense = () => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette dépense ? Cette action est simulée.")) {
      console.log("Deleting expense:", expense.id)
      alert("Dépense supprimée (simulation).")
      if (expense.group) {
        router.push(`/group-details-example?groupId=${expense.group.id}`)
      } else {
        router.push("/dashboard-example")
      }
    }
  }

  const handlePostComment = () => {
    if (newComment.trim() === "") return

    const postedComment: Comment = {
      id: `c${Date.now()}`, // Simple unique ID for simulation
      author: DUMMY_CURRENT_USER,
      text: newComment.trim(),
      timestamp: new Date().toISOString(),
    }

    console.log("Posting comment (simulated):", postedComment)
    alert("Commentaire publié (simulation).")

    // Optimistic update: add comment to local state
    setExpense((prevExpense) => ({
      ...prevExpense,
      comments: [...(prevExpense.comments || []), postedComment],
    }))
    setNewComment("") // Clear input
  }

  return (
    <div className="w-full max-w-md h-[800px] max-h-[90vh] bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col">
      <header className="p-4 flex items-center justify-between border-b sticky top-0 bg-white z-10">
        <Link
          href={expense.group ? `/group-details-example?groupId=${expense.group.id}` : "/dashboard-example"}
          passHref
          legacyBehavior
        >
          <Button variant="ghost" size="icon" className="mr-2" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold text-gray-800 truncate" title={expense.description}>
          Expense Details
        </h1>
        <div className="flex items-center gap-1">
          <Link
            href={`/edit-expense-example?expenseId=${expense.id}&groupId=${expense.group?.id || "none"}`}
            passHref
            legacyBehavior
          >
            <Button asChild variant="ghost" size="icon" aria-label="Edit expense">
              <a>
                <Edit3 className="h-5 w-5" />
              </a>
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="text-red-500 hover:text-red-600"
            aria-label="Delete expense"
            onClick={handleDeleteExpense}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-grow">
        <div className="p-5 space-y-5">
          {/* Main Info Card, Split Details, Receipt, Notes... (existing cards remain here) */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl leading-tight">{expense.description}</CardTitle>
              {expense.group && (
                <CardDescription className="text-sm">
                  In group:{" "}
                  <Link
                    href={`/group-details-example?groupId=${expense.group.id}`}
                    className="text-primary hover:underline"
                  >
                    {expense.group.name}
                  </Link>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-2xl font-bold text-primary">
                <Landmark className="h-6 w-6 mr-2 text-muted-foreground" />
                {currencySymbol}
                {expense.amount}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4 mr-2" />
                {format(new Date(expense.date), "EEEE, MMMM d, yyyy")}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Tag className="h-4 w-4 mr-2" /> Category: {expense.category}
              </div>
              <div className="flex items-center text-sm">
                <UserCircle className="h-4 w-4 mr-2 text-muted-foreground" /> Paid by:
                <Avatar className="h-5 w-5 ml-1.5 mr-1">
                  <AvatarImage src={expense.paidBy.avatarUrl || "/placeholder.svg"} alt={expense.paidBy.name} />
                  <AvatarFallback>{expense.paidBy.name.substring(0, 1)}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{expense.paidBy.name}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Users className="h-5 w-5 mr-2 text-muted-foreground" />
                Split Between ({expense.splitDetails.length} people)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {expense.splitDetails.map((split, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded-md">
                  <div className="flex items-center">
                    <Avatar className="h-7 w-7 mr-2">
                      <AvatarImage src={split.member.avatarUrl || "/placeholder.svg"} alt={split.member.name} />
                      <AvatarFallback>{split.member.name.substring(0, 1)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{split.member.name}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Share: {split.share}</span>
                    {Number.parseFloat(split.owes.replace(/[^\d.-]/g, "")) > 0 && (
                      <span className="ml-2 text-red-600">(Owes: {split.owes})</span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {expense.receiptUrl && (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Paperclip className="h-5 w-5 mr-2 text-muted-foreground" />
                  Receipt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={expense.receiptUrl || "/placeholder.svg"}
                  alt="Expense receipt"
                  className="rounded-md border max-h-60 w-auto mx-auto cursor-pointer"
                  onClick={() => window.open(expense.receiptUrl, "_blank")}
                />
              </CardContent>
            </Card>
          )}

          {expense.notes && (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <StickyNote className="h-5 w-5 mr-2 text-muted-foreground" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{expense.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Comments Section */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-muted-foreground" />
                Commentaires ({expense.comments?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {expense.comments && expense.comments.length > 0 ? (
                <div className="max-h-60 overflow-y-auto pr-2">
                  {" "}
                  {/* Scroll for many comments */}
                  {expense.comments.map((comment) => (
                    <CommentItem key={comment.id} comment={comment} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-2">Aucun commentaire pour le moment.</p>
              )}
              <div className="flex items-start gap-3 pt-3 border-t">
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarImage src={DUMMY_CURRENT_USER.avatarUrl || "/placeholder.svg"} alt={DUMMY_CURRENT_USER.name} />
                  <AvatarFallback>{DUMMY_CURRENT_USER.name.substring(0, 1)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Ajouter un commentaire..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[60px]"
                  />
                  <Button onClick={handlePostComment} size="sm" className="mt-2" disabled={!newComment.trim()}>
                    <Send className="h-4 w-4 mr-2" /> Publier
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}

ExpenseDetailsScreen.defaultProps = {
  expense: {
    id: "defaultExp",
    description: "Default Expense Description",
    amount: "0.00",
    currency: "USD",
    date: new Date().toISOString(),
    category: "Uncategorized",
    paidBy: { id: "u0", name: "Default User", avatarUrl: "/placeholder.svg?width=40&height=40" },
    splitDetails: [],
    comments: [],
  },
}
