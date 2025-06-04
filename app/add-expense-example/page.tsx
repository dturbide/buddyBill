import AddExpenseScreen from "@/components/add-expense-screen"

export default function AddExpensePage() {
  // In a real app, this data would come from the selected group context
  const dummyGroupContext = {
    id: "1",
    name: "Weekend Trip Crew",
    defaultCurrency: "EUR",
    members: [
      { id: "u1", name: "Alice (You)", isCurrentUser: true },
      { id: "u2", name: "Bob", isCurrentUser: false },
      { id: "u3", name: "Charlie", isCurrentUser: false },
      { id: "u4", name: "Diana", isCurrentUser: false },
    ],
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-100 p-4">
      <AddExpenseScreen groupContext={dummyGroupContext} />
    </div>
  )
}
