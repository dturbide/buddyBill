// This file will store dummy data for expenses and group contexts
// to be used by example pages.

export interface Member {
  id: string
  name: string
  isCurrentUser?: boolean
  avatarUrl?: string
}

export interface GroupContext {
  id: string
  name: string
  defaultCurrency: string
  members: Member[]
}

export interface Comment {
  id: string
  author: {
    id: string
    name: string
    avatarUrl?: string
  }
  text: string
  timestamp: string // ISO string
}

export interface DetailedExpenseData {
  id: string
  description: string
  amount: string
  currency: string
  date: string // ISO string
  category: string
  paidBy: { id: string; name: string; avatarUrl?: string }
  group: { id: string; name: string }
  splitDetails: Array<{
    member: { id: string; name: string; avatarUrl?: string }
    share: string
    owes: string
  }>
  receiptUrl?: string
  notes?: string
  comments?: Comment[] // Added comments
}

export const DUMMY_CURRENT_USER = {
  id: "u1",
  name: "Alice (Vous)",
  avatarUrl: "/placeholder.svg?width=40&height=40",
}

export const DUMMY_EXPENSES: DetailedExpenseData[] = [
  {
    id: "e1",
    description: "Dîner d'anniversaire pour l'équipe",
    amount: "125.50",
    currency: "EUR",
    date: "2024-06-03T19:00:00Z",
    category: "Restaurant & Nourriture",
    paidBy: { id: "u1", name: "Alice (Vous)", avatarUrl: "/placeholder.svg?width=40&height=40" },
    group: { id: "g1", name: "Weekend Trip Crew" },
    splitDetails: [
      {
        member: { id: "u1", name: "Alice (Vous)", avatarUrl: "/placeholder.svg?width=40&height=40" },
        share: "€31.38",
        owes: "€0.00",
      },
      {
        member: { id: "u2", name: "Bob", avatarUrl: "/placeholder.svg?width=40&height=40" },
        share: "€31.37",
        owes: "€31.37",
      },
      {
        member: { id: "u3", name: "Charlie", avatarUrl: "/placeholder.svg?width=40&height=40" },
        share: "€31.37",
        owes: "€31.37",
      },
      {
        member: { id: "u4", name: "Diana", avatarUrl: "/placeholder.svg?width=40&height=40" },
        share: "€31.38",
        owes: "€31.38",
      },
    ],
    receiptUrl: "/placeholder.svg?width=600&height=800",
    notes: "C'était une super soirée ! Penser à réserver plus tôt la prochaine fois.",
    comments: [
      {
        id: "c1",
        author: { id: "u2", name: "Bob", avatarUrl: "/placeholder.svg?width=40&height=40" },
        text: "Super idée ce restaurant !",
        timestamp: "2024-06-03T21:00:00Z",
      },
      {
        id: "c2",
        author: { id: "u1", name: "Alice (Vous)", avatarUrl: "/placeholder.svg?width=40&height=40" },
        text: "Oui, tout le monde a apprécié :)",
        timestamp: "2024-06-03T21:05:00Z",
      },
    ],
  },
  {
    id: "e2",
    description: "Courses pour la semaine",
    amount: "75.20",
    currency: "EUR",
    date: "2024-06-01T10:00:00Z",
    category: "Food",
    paidBy: { id: "u1", name: "Alice (Vous)", avatarUrl: "/placeholder.svg?width=40&height=40" },
    group: { id: "g1", name: "Weekend Trip Crew" },
    splitDetails: [
      {
        member: { id: "u1", name: "Alice (Vous)", avatarUrl: "/placeholder.svg?width=40&height=40" },
        share: "€37.60",
        owes: "€0.00",
      },
      {
        member: { id: "u2", name: "Bob", avatarUrl: "/placeholder.svg?width=40&height=40" },
        share: "€37.60",
        owes: "€37.60",
      },
    ],
    notes: "Achat des produits de base.",
    comments: [], // No comments for this one yet
  },
]

export const DUMMY_GROUPS_CONTEXT_MAP: { [key: string]: GroupContext } = {
  g1: {
    id: "g1",
    name: "Weekend Trip Crew",
    defaultCurrency: "EUR",
    members: [
      { id: "u1", name: "Alice (Vous)", isCurrentUser: true, avatarUrl: "/placeholder.svg?width=40&height=40" },
      { id: "u2", name: "Bob", isCurrentUser: false, avatarUrl: "/placeholder.svg?width=40&height=40" },
      { id: "u3", name: "Charlie", isCurrentUser: false, avatarUrl: "/placeholder.svg?width=40&height=40" },
      { id: "u4", name: "Diana", isCurrentUser: false, avatarUrl: "/placeholder.svg?width=40&height=40" },
    ],
  },
}
