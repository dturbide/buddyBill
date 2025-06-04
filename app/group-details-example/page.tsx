import GroupDetailsScreen from "@/components/group-details-screen"

export default function GroupDetailsPage() {
  const dummyGroup = {
    id: "1",
    name: "Weekend Trip Crew",
    imageUrl: "/placeholder.svg?width=80&height=80",
    members: [
      { id: "u1", name: "Alice", avatarUrl: "/placeholder.svg?width=40&height=40", balance: "+€25.50" },
      { id: "u2", name: "Bob", avatarUrl: "/placeholder.svg?width=40&height=40", balance: "-€10.00" },
      { id: "u3", name: "Charlie", avatarUrl: "/placeholder.svg?width=40&height=40", balance: "Settled" },
      { id: "u4", name: "Diana", avatarUrl: "/placeholder.svg?width=40&height=40", balance: "-€15.50" },
      { id: "u5", name: "Edward", avatarUrl: "/placeholder.svg?width=40&height=40", balance: "+€5.00" },
    ],
    expenses: [
      {
        id: "e1",
        description: "Groceries for the week",
        amount: "75.20", // Amount as string for display flexibility
        currency: "EUR",
        date: "2024-06-01",
        category: "Food",
        paidBy: "Alice",
        paidById: "u1",
      },
      {
        id: "e2",
        description: "Movie tickets - 'Dune Part Two'",
        amount: "32.00",
        currency: "EUR",
        date: "2024-06-02",
        category: "Activities",
        paidBy: "Bob",
        paidById: "u2",
      },
    ],
    // Dummy balances data: who owes whom
    balancesSummary: [
      { from: "Bob", fromId: "u2", to: "Alice", toId: "u1", amount: "10.00", currency: "EUR" },
      { from: "Diana", fromId: "u4", to: "Alice", toId: "u1", amount: "15.50", currency: "EUR" },
      // Edward might owe someone or be owed, but not shown for simplicity here
      // Charlie is settled
    ],
    userOverallBalance: {
      // Current user's (Alice) perspective
      totalOwedToUser: "25.50",
      totalUserOwes: "0.00",
      netBalance: "+25.50",
      currency: "EUR",
    },
  }
  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-100 p-4">
      <GroupDetailsScreen group={dummyGroup} />
    </div>
  )
}
