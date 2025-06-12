"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslation } from 'react-i18next'
import { cn } from "@/lib/utils"
import {
  LayoutGrid,
  ListChecks,
  Scale,
  User,
  UsersRound,
} from "lucide-react"

interface NavItemProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
  active: boolean
}

function NavItem({ icon: Icon, label, href, active }: NavItemProps) {
  return (
    <Link 
      href={href} 
      className={`flex flex-col items-center space-y-1 p-1 sm:p-2 rounded-lg transition-colors
        ${active 
          ? 'text-primary bg-primary/10' 
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
        }`}
    >
      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      <span className="text-[10px] leading-tight sm:text-xs text-center" suppressHydrationWarning>
        {label}
      </span>
    </Link>
  )
}

export default function BottomNavigation() {
  const { t } = useTranslation(['common'])
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fallback labels si i18n pas encore chargé ou côté serveur
  const getLabel = (key: string, fallback: string) => {
    if (!mounted) return fallback
    return t(key) || fallback
  }

  const navItems = [
    { icon: LayoutGrid, label: getLabel('common:navigation.dashboard', 'Dashboard'), href: "/dashboard", active: pathname === "/dashboard" },
    { icon: UsersRound, label: getLabel('common:navigation.groups', 'Groupes'), href: "/dashboard/groups", active: pathname === "/dashboard/groups" },
    { icon: ListChecks, label: getLabel('common:navigation.expenses', 'Dépenses'), href: "/dashboard/expenses", active: pathname.startsWith("/dashboard/expenses") },
    { icon: Scale, label: getLabel('common:navigation.balances', 'Équilibres'), href: "/dashboard/settle-up", active: pathname === "/dashboard/settle-up" },
    { icon: User, label: getLabel('common:navigation.profile', 'Profil'), href: "/dashboard/profile", active: pathname === "/dashboard/profile" },
  ]

  return (
    <nav className="p-1 sm:p-2 border-t bg-slate-50 grid grid-cols-5 gap-0.5 sm:gap-1">
      {navItems.map((item) => (
        <NavItem key={item.label} {...item} />
      ))}
    </nav>
  )
}
