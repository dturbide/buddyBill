"use client"

import React from "react"
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

export default function BottomNavigation() {
  const { t } = useTranslation(['common'])
  const pathname = usePathname()

  const navItems = [
    { icon: LayoutGrid, label: t('common:navigation.dashboard'), href: "/dashboard", active: pathname === "/dashboard" },
    { icon: UsersRound, label: t('common:navigation.groups'), href: "/dashboard/groups", active: pathname === "/dashboard/groups" },
    { icon: ListChecks, label: t('common:navigation.expenses'), href: "/dashboard/expenses", active: pathname.startsWith("/dashboard/expenses") },
    { icon: Scale, label: t('common:navigation.balances'), href: "/dashboard/settle-up", active: pathname === "/dashboard/settle-up" },
    { icon: User, label: t('common:navigation.profile'), href: "/dashboard/profile", active: pathname === "/dashboard/profile" },
  ]

  return (
    <nav className="p-1 sm:p-2 border-t bg-slate-50 grid grid-cols-5 gap-0.5 sm:gap-1">
      {navItems.map((item) => (
        <NavItem key={item.label} {...item} />
      ))}
    </nav>
  )
}
