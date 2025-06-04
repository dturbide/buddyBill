import React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area" // ScrollArea still used for main content
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  Bell,
  PlusCircle,
  Send,
  UsersRound,
  CheckCircle,
  LayoutGrid,
  ListChecks,
  Scale,
  User,
  HomeIcon,
  CreditCard,
  DollarSign,
  Activity,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"

interface SummaryCardProps {
  title: string
  value: string
  icon: React.ElementType
  bgColor?: string
  textColor?: string
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  icon: Icon,
  bgColor = "bg-muted",
  textColor = "text-foreground",
}) => (
  // Removed fixed width and flex-shrink-0, card will take grid cell width
  <Card className={cn("w-full", bgColor, textColor)}>
    <CardHeader className="p-2 sm:p-3">
      {" "}
      {/* Adjusted padding slightly */}
      <CardTitle className="text-xs sm:text-sm font-medium truncate">{title}</CardTitle>
    </CardHeader>
    <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
      {" "}
      {/* Adjusted padding slightly */}
      <div className="text-base sm:text-xl font-bold">{value}</div> {/* Adjusted font size for smaller cards */}
      <Icon className="h-4 w-4 text-muted-foreground mt-1" />
    </CardContent>
  </Card>
)

interface ActivityItemProps {
  description: string
  amount?: string
  type: "expense" | "payment"
}

const ActivityItem: React.FC<ActivityItemProps> = ({ description, amount, type }) => (
  <div className="flex items-center justify-between py-2 sm:py-3">
    <div className="flex items-center gap-2 sm:gap-3">
      {type === "expense" ? (
        <CreditCard className="h-5 w-5 text-red-500" />
      ) : (
        <DollarSign className="h-5 w-5 text-green-500" />
      )}
      <p className="text-sm text-muted-foreground flex-1 min-w-0">{description}</p>
    </div>
    {amount && <p className="text-sm font-medium">{amount}</p>}
  </div>
)

interface NavItemProps {
  icon: React.ElementType
  label: string
  active?: boolean
  href?: string
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, active, href = "#" }) => (
  <Link
    href={href}
    className={cn(
      "flex flex-col items-center gap-0.5 p-1 sm:p-2 rounded-md flex-1",
      active ? "text-primary" : "text-muted-foreground hover:text-primary",
    )}
  >
    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
    <span className="text-[10px] leading-tight sm:text-xs text-center">{label}</span>
  </Link>
)

export default function DashboardScreen() {
  const summaryData = [
    {
      title: "Total Owed to You",
      value: "$125.50",
      icon: DollarSign,
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-700",
    },
    { title: "Total You Owe", value: "$42.00", icon: DollarSign, bgColor: "bg-rose-50", textColor: "text-rose-700" },
    { title: "Month's Expenses", value: "$350.75", icon: CreditCard },
    { title: "Active Groups", value: "3", icon: UsersRound },
    { title: "Pending", value: "2", icon: Activity },
  ]

  const recentActivities = [
    { description: "Dinner with friends", amount: "-$25.50", type: "expense" as const },
    { description: "Payment from Alex", amount: "+$50.00", type: "payment" as const },
    { description: "Groceries", amount: "-$15.20", type: "expense" as const },
  ]

  const navItems = [
    { icon: HomeIcon, label: "Home", active: true, href: "/dashboard-example" },
    { icon: LayoutGrid, label: "Groups", href: "/groups-list-example" },
    { icon: ListChecks, label: "Expenses", href: "/add-expense-example" },
    { icon: Scale, label: "Balances", href: "/settle-up-example" },
    { icon: User, label: "Profile", href: "/user-profile-example" },
  ]

  return (
    <div className="w-full max-w-md h-[800px] max-h-[90vh] bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col">
      <header className="p-3 sm:p-4 flex items-center justify-between border-b">
        <h1 className="text-lg sm:text-xl font-bold text-gray-800">SplitEase</h1>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center">
              3
            </span>
          </div>
          <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
            <AvatarImage src="/placeholder.svg?width=32&height=32" alt="User" />
            <AvatarFallback>ME</AvatarFallback>
          </Avatar>
        </div>
      </header>
      <ScrollArea className="flex-grow">
        <div className="p-3 sm:p-4 space-y-5 sm:space-y-6">
          <section>
            <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">Overview</h2>
            {/* Changed from ScrollArea to a responsive grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
              {" "}
              {/* lg:grid-cols-3 to prevent too many columns if more cards are added */}
              {summaryData.map((item) => (
                <SummaryCard key={item.title} {...item} />
              ))}
            </div>
          </section>
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white h-12 text-sm w-full">
              <PlusCircle className="mr-2 h-5 w-5" /> Add Expense
            </Button>
            <Button variant="outline" size="lg" className="text-sm h-12 w-full">
              <Send className="mr-2 h-5 w-5" /> Record Payment
            </Button>
            <Button variant="outline" size="lg" className="text-sm h-12 w-full">
              <UsersRound className="mr-2 h-5 w-5" /> Create Group
            </Button>
            <Button variant="outline" size="lg" className="text-sm h-12 w-full">
              <CheckCircle className="mr-2 h-5 w-5" /> Settle Up
            </Button>
          </section>
          <section>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-base sm:text-lg font-semibold text-gray-700">Recent Activity</h2>
              <Link
                href="/recent-activity-example"
                className="text-xs sm:text-sm text-primary hover:underline flex items-center"
              >
                View All <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
              </Link>
            </div>
            <Card>
              <CardContent className="p-0">
                {recentActivities.map((activity, index) => (
                  <React.Fragment key={index}>
                    <div className="px-3 sm:px-4">
                      <ActivityItem {...activity} />
                    </div>
                    {index < recentActivities.length - 1 && <Separator />}
                  </React.Fragment>
                ))}
              </CardContent>
            </Card>
          </section>
        </div>
      </ScrollArea>
      <nav className="p-1 sm:p-2 border-t bg-slate-50 grid grid-cols-5 gap-0.5 sm:gap-1">
        {navItems.map((item) => (
          <NavItem key={item.label} {...item} />
        ))}
      </nav>
    </div>
  )
}
DashboardScreen.defaultProps = {}
