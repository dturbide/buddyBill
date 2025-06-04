import RecentActivityScreen from "@/components/recent-activity-screen"

export default function RecentActivityPage() {
  // In a real app, this data would be fetched
  const dummyActivities = [
    {
      id: "act1",
      type: "expense_added" as const,
      timestamp: "2024-06-03T10:30:00Z",
      user: { name: "Alice", avatarUrl: "/placeholder.svg?width=40&height=40" },
      group: { name: "Weekend Trip" },
      description: 'Alice a ajouté une dépense "Dîner d\'équipe" de €125.50 dans Weekend Trip.',
      amount: "€125.50",
      expenseId: "e1",
    },
    {
      id: "act2",
      type: "payment_made" as const,
      timestamp: "2024-06-02T15:45:00Z",
      user: { name: "Bob", avatarUrl: "/placeholder.svg?width=40&height=40" },
      targetUser: { name: "Alice", avatarUrl: "/placeholder.svg?width=40&height=40" },
      group: { name: "Weekend Trip" },
      description: "Bob a payé €30.00 à Alice dans Weekend Trip.",
      amount: "€30.00",
      paymentId: "p1",
    },
    {
      id: "act3",
      type: "member_joined" as const,
      timestamp: "2024-06-01T09:00:00Z",
      user: { name: "Charlie", avatarUrl: "/placeholder.svg?width=40&height=40" },
      group: { name: "Projet Alpha" },
      description: "Charlie a rejoint le groupe Projet Alpha.",
    },
    {
      id: "act4",
      type: "expense_updated" as const,
      timestamp: "2024-05-31T11:00:00Z",
      user: { name: "Diana", avatarUrl: "/placeholder.svg?width=40&height=40" },
      group: { name: "Vacances d'été" },
      description: "Diana a modifié la dépense \"Billets d'avion\" dans Vacances d'été.",
      expenseId: "e2",
    },
    {
      id: "act5",
      type: "comment_added" as const,
      timestamp: "2024-05-30T18:20:00Z",
      user: { name: "Edward", avatarUrl: "/placeholder.svg?width=40&height=40" },
      group: { name: "Weekend Trip" },
      description: 'Edward a commenté la dépense "Location de voiture".',
      expenseId: "e3",
      commentPreview: "N'oubliez pas l'assurance !",
    },
    {
      id: "act6",
      type: "group_created" as const,
      timestamp: "2024-05-29T14:00:00Z",
      user: { name: "Alice", avatarUrl: "/placeholder.svg?width=40&height=40" },
      group: { name: "Nouveau Projet X" },
      description: 'Alice a créé le groupe "Nouveau Projet X".',
    },
  ]

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-100 p-4">
      <RecentActivityScreen activities={dummyActivities} />
    </div>
  )
}
