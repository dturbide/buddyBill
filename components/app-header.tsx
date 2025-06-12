"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import LanguageSwitcher from "./language-switcher"
import { OfflineIndicator } from "./offline-indicator"

interface AppHeaderProps {
  title?: string
  showBackButton?: boolean
  backHref?: string
}

export default function AppHeader({ title, showBackButton = false, backHref = "/dashboard" }: AppHeaderProps) {
  const { t } = useTranslation(['common'])
  const [userProfile, setUserProfile] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          
          setUserProfile(profile)
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      }
    }

    fetchUserProfile()
  }, [supabase])

  return (
    <header className="p-3 sm:p-4 flex items-center justify-between border-b bg-white sticky top-0 z-10">
      <div className="flex items-center gap-2">
        {showBackButton && (
          <Link href={backHref}>
            <Button variant="ghost" size="icon" className="mr-2" aria-label="Retour">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
        )}
        <h1 className="text-lg sm:text-xl font-bold text-gray-800">
          {title || "BuddyBill"}
        </h1>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Indicateur offline-first */}
        <OfflineIndicator variant="compact" />
        
        <LanguageSwitcher />
        <div className="relative">
          <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center">
            0
          </span>
        </div>
        <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
          <AvatarImage src={userProfile?.avatar_url} alt="User" />
          <AvatarFallback>
            {userProfile?.full_name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
