import SettleUpScreen from "@/components/settle-up-screen"

export default function SettleUpPage() {
  // In a real app, this data would come from the selected group or user context
  const dummyGroupContext = {
    id: "1",
    name: "Weekend Trip Crew",
    members: [
      { id: "u1", name: "Alice (You)", isCurrentUser: true, avatarUrl: "/placeholder.svg?width=40&height=40" },
      { id: "u2", name: "Bob", isCurrentUser: false, avatarUrl: "/placeholder.svg?width=40&height=40" },
      { id: "u3", name: "Charlie", isCurrentUser: false, avatarUrl: "/placeholder.svg?width=40&height=40" },
      { id: "u4", name: "Diana", isCurrentUser: false, avatarUrl: "/placeholder.svg?width=40&height=40" },
    ],
    defaultCurrency: "EUR", // Or fetch user's default currency
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-100 p-4">
      <SettleUpScreen groupContext={dummyGroupContext} />
    </div>
  )
}
