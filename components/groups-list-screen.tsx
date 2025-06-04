// No changes needed
"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, PlusCircle, Users, Filter, MoreVertical, Plus } from "lucide-react"
import Link from "next/link"

interface Group {
  id: string
  name: string
  imageUrl?: string
  memberCount: number
  userBalance: string
  lastActivity: string
}

const dummyGroups: Group[] = [
  {
    id: "1",
    name: "Weekend Trip Crew",
    imageUrl: "/placeholder.svg?width=60&height=60",
    memberCount: 5,
    userBalance: "+$25.50",
    lastActivity: "Today, 2:30 PM",
  },
  {
    id: "2",
    name: "Apartment Roomies",
    imageUrl: "/placeholder.svg?width=60&height=60",
    memberCount: 3,
    userBalance: "-$10.00",
    lastActivity: "Yesterday",
  },
  {
    id: "3",
    name: "Office Lunch Club",
    imageUrl: "/placeholder.svg?width=60&height=60",
    memberCount: 8,
    userBalance: "Settled",
    lastActivity: "3 days ago",
  },
  {
    id: "4",
    name: "Book Club",
    imageUrl: "/placeholder.svg?width=60&height=60",
    memberCount: 12,
    userBalance: "+$5.00",
    lastActivity: "Last week",
  },
]

const GroupCard: React.FC<{ group: Group }> = ({ group }) => {
  const balanceColor = group.userBalance.startsWith("+")
    ? "text-green-600"
    : group.userBalance.startsWith("-")
      ? "text-red-600"
      : "text-gray-500"
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-4">
        <Avatar className="h-12 w-12 rounded-lg">
          <AvatarImage src={group.imageUrl || "/placeholder.svg"} alt={group.name} />
          <AvatarFallback>{group.name.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="text-base font-semibold mb-0.5">{group.name}</CardTitle>
          <div className="flex items-center text-xs text-muted-foreground">
            <Users className="h-3 w-3 mr-1" /> {group.memberCount} members
          </div>
          <p className={`text-sm font-medium mt-1 ${balanceColor}`}>{group.userBalance}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" /> <span className="sr-only">Group options</span>
        </Button>
      </CardHeader>
      <CardFooter className="p-4 pt-0 flex justify-between items-center text-xs text-muted-foreground">
        <span>Last activity: {group.lastActivity}</span>
      </CardFooter>
    </Card>
  )
}

export default function GroupsListScreen() {
  return (
    <div className="w-full max-w-md h-[800px] max-h-[90vh] bg-slate-50 shadow-2xl rounded-3xl overflow-hidden flex flex-col relative">
      <header className="p-4 flex items-center justify-between border-b sticky top-0 bg-white z-10">
        <h1 className="text-lg font-semibold text-gray-800">My Groups</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            {" "}
            <Search className="h-5 w-5" /> <span className="sr-only">Search groups</span>{" "}
          </Button>
          <Button variant="ghost" size="icon">
            {" "}
            <Filter className="h-5 w-5" /> <span className="sr-only">Filter groups</span>{" "}
          </Button>
        </div>
      </header>
      <div className="p-4 border-b">
        <Link href="/create-group-example" passHref legacyBehavior>
          <Button className="w-full">
            {" "}
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Group{" "}
          </Button>
        </Link>
      </div>
      <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-slate-100">
        {dummyGroups.map((group) => (
          <GroupCard key={group.id} group={group} />
        ))}
        {dummyGroups.length === 0 && (
          <div className="text-center py-10">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="text-muted-foreground">You are not part of any groups yet.</p>
            <p className="text-sm text-muted-foreground">Create a group to start sharing expenses!</p>
          </div>
        )}
      </div>
      <Link href="/create-group-example" passHref legacyBehavior>
        <Button
          className="absolute bottom-6 right-6 rounded-full h-14 w-14 shadow-lg"
          size="icon"
          aria-label="Create New Group"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </Link>
    </div>
  )
}
GroupsListScreen.defaultProps = {}
