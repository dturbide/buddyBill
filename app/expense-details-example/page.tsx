import ExpenseDetailsScreen from "@/components/expense-details-screen"
import { DUMMY_EXPENSES } from "@/lib/dummy-data" // Import DUMMY_EXPENSES

interface ExpenseDetailsPageProps {
  searchParams?: {
    // searchParams can be optional
    expenseId?: string
  }
}

export default function ExpenseDetailsPage({ searchParams }: ExpenseDetailsPageProps) {
  // Default to the first expense if no ID is provided, or handle error
  const expenseIdToLoad = searchParams?.expenseId || DUMMY_EXPENSES[0]?.id || "e1"
  const expense = DUMMY_EXPENSES.find((exp) => exp.id === expenseIdToLoad)

  if (!expense) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-100 p-4">
        <p>Dépense non trouvée.</p>
      </div>
    )
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-100 p-4">
      <ExpenseDetailsScreen expense={expense} />
    </div>
  )
}
