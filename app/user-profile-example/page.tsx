import UserProfileScreen from "@/components/user-profile-screen"

export default function UserProfilePage() {
  // In a real app, this data would be fetched for the logged-in user
  const dummyUser = {
    id: "u1",
    name: "Alice Wonderland",
    email: "alice.wonderland@example.com",
    avatarUrl: "/placeholder.svg?width=100&height=100", // Placeholder with query
    phone: "+1 123-456-7890",
    defaultCurrency: "EUR",
    notificationPreferences: {
      newExpense: true,
      paymentReceived: true,
      groupUpdates: false,
    },
    memberSince: "2023-01-15T10:00:00Z",
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-100 p-4">
      <UserProfileScreen user={dummyUser} />
    </div>
  )
}
