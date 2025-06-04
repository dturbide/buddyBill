import EditExpenseScreen from "@/components/edit-expense-screen"
import { DUMMY_EXPENSES, DUMMY_GROUPS_CONTEXT_MAP } from "@/lib/dummy-data" // We'll create this file

interface EditExpensePageProps {
  searchParams: {
    expenseId?: string
    groupId?: string
  }
}

export default function EditExpensePage({ searchParams }: EditExpensePageProps) {
  const { expenseId, groupId } = searchParams

  // Find the expense to edit from dummy data
  const expenseToEdit = DUMMY_EXPENSES.find((exp) => exp.id === expenseId)

  // Find the group context from dummy data
  const groupContext = groupId ? DUMMY_GROUPS_CONTEXT_MAP[groupId] : undefined

  if (!expenseToEdit || !groupContext) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-100 p-4">
        <p>Dépense ou groupe non trouvé.</p>
      </div>
    )
  }

  // Adapt the detailed expense structure to the simplified ExpenseToEditData
  const adaptedExpenseToEdit = {
    id: expenseToEdit.id,
    description: expenseToEdit.description,
    amount: expenseToEdit.amount,
    currency: expenseToEdit.currency,
    date: expenseToEdit.date,
    category: expenseToEdit.category,
    paidById: expenseToEdit.paidBy.id,
    splitWithMemberIds: expenseToEdit.splitDetails.map((sd) => sd.member.id), // Extract member IDs from splitDetails
    receiptUrl: expenseToEdit.receiptUrl,
    notes: expenseToEdit.notes,
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-100 p-4">
      <EditExpenseScreen groupContext={groupContext} expenseToEdit={adaptedExpenseToEdit} />
    </div>
  )
}
