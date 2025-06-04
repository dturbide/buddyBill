"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ArrowLeft,
  Filter,
  CreditCard,
  Users,
  MessageSquare,
  Edit2,
  UserPlus,
  HandCoins,
  PlusSquare,
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow, parseISO } from "date-fns"
import { fr } from "date-fns/locale" // For French time formatting

type ActivityType =
  | "expense_added"
  | "expense_updated"
  | "payment_made"
  | "member_joined"
  | "group_created"
  | "comment_added"

interface UserInfo {
  name: string
  avatarUrl?: string
}

interface GroupInfo {
  name: string
}

interface Activity {
  id: string
  type: ActivityType
  timestamp: string // ISO string
  user: UserInfo // User who performed the action
  targetUser?: UserInfo // e.g., who received payment
  group?: GroupInfo // Group associated with the activity
  description: string // Pre-formatted description
  amount?: string // e.g., "€125.50"
  expenseId?: string
  paymentId?: string
  commentPreview?: string
}

interface RecentActivityScreenProps {
  activities: Activity[]
}

const ActivityIcon: React.FC<{ type: ActivityType }> = ({ type }) => {
  switch (type) {
    case "expense_added":
      return <CreditCard className="h-5 w-5 text-blue-500" />
    case "expense_updated":
      return <Edit2 className="h-5 w-5 text-orange-500" />
    case "payment_made":
      return <HandCoins className="h-5 w-5 text-green-500" />
    case "member_joined":
      return <UserPlus className="h-5 w-5 text-teal-500" />
    case "group_created":
      return <PlusSquare className="h-5 w-5 text-purple-500" />
    case "comment_added":
      return <MessageSquare className="h-5 w-5 text-indigo-500" />
    default:
      return <Users className="h-5 w-5 text-gray-500" />
  }
}

export default function RecentActivityScreen({ activities }: RecentActivityScreenProps) {
  const sortedActivities = [...activities].sort(
    (a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime(),
  )

  return (
    <div className="w-full max-w-md h-[800px] max-h-[90vh] bg-slate-50 shadow-2xl rounded-3xl overflow-hidden flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b sticky top-0 bg-white z-10">
        <Link href="/dashboard-example" passHref legacyBehavior>
          <Button variant="ghost" size="icon" className="mr-2" aria-label="Back to Dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold text-gray-800">Recent Activity</h1>
        <Button variant="ghost" size="icon" aria-label="Filter activity">
          <Filter className="h-5 w-5" />
        </Button>
      </header>

      {/* Activity List (Scrollable) */}
      <ScrollArea className="flex-grow">
        {sortedActivities.length === 0 ? (
          <div className="text-center py-20">
            <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-muted-foreground">No recent activity to display.</p>
            <p className="text-sm text-gray-400">Start using the app to see updates here!</p>
          </div>
        ) : (
          <div className="p-1">
            {sortedActivities.map((activity) => (
              <Card key={activity.id} className="m-2 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <ActivityIcon type={activity.type} />
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm text-gray-700 leading-snug">{activity.description}</p>
                      {activity.commentPreview && (
                        <p className="mt-1 text-xs text-gray-500 bg-slate-100 p-1.5 rounded-md">
                          &quot;{activity.commentPreview}&quot;
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(parseISO(activity.timestamp), { addSuffix: true, locale: fr })}
                      </p>
                    </div>
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={activity.user.avatarUrl || "/placeholder.svg"} alt={activity.user.name} />
                      <AvatarFallback>{activity.user.name.substring(0, 1)}</AvatarFallback>
                    </Avatar>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

RecentActivityScreen.defaultProps = {
  activities: [],
}
