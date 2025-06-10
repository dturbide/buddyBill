"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import PWAInstallButton from "@/components/pwa-install-button"
import { usePWAStandalone } from "@/hooks/use-pwa-standalone"
import PullToRefresh from "@/components/pull-to-refresh"
import {
  Bell,
  PlusCircle,
  Send,
  UsersRound,
  CheckCircle,
  LayoutGrid,
  ListChecks,
  Scale,
  User,
  HomeIcon,
  CreditCard,
  DollarSign,
  Activity,
  ArrowRight,
  Eye,
  Plus,
  Settings,
  ChevronRight,
  Receipt,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import LanguageSwitcher from "./language-switcher"
import QuickAddExpenseModal from '@/components/quick-add-expense-modal'

interface SummaryCardProps {
  title: string
  value: string
  icon: React.ElementType
  bgColor?: string
  textColor?: string
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  icon: Icon,
  bgColor = "bg-muted",
  textColor = "text-foreground",
}) => (
  <Card className={cn("w-full", bgColor, textColor)}>
    <CardHeader className="p-mobile-md sm:p-mobile-lg">
      <CardTitle className="text-mobile-sm sm:text-mobile-base font-medium truncate">{title}</CardTitle>
    </CardHeader>
    <CardContent className="p-mobile-md pt-0 sm:p-mobile-lg sm:pt-0">
      <div className="text-mobile-lg sm:text-mobile-xl font-bold">{value}</div>
      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground mt-1" />
    </CardContent>
  </Card>
)

interface ActivityItemProps {
  description: string
  amount?: string
  type: "expense" | "payment"
}

const ActivityItem: React.FC<ActivityItemProps> = ({ description, amount, type }) => (
  <div className="flex items-center justify-between py-mobile-sm sm:py-mobile-md touch-target">
    <div className="flex items-center gap-mobile-sm sm:gap-mobile-md">
      {type === "expense" ? (
        <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
      ) : (
        <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
      )}
      <p className="text-mobile-sm sm:text-mobile-base text-muted-foreground flex-1 min-w-0">{description}</p>
    </div>
    {amount && <p className="text-mobile-sm sm:text-mobile-base font-medium">{amount}</p>}
  </div>
)

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
      "flex flex-col items-center justify-center gap-1 p-mobile-xs sm:p-mobile-sm rounded-mobile flex-1 touch-target min-h-[50px] sm:min-h-[60px]",
      active ? "text-primary" : "text-muted-foreground hover:text-primary",
    )}
  >
    <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
    <span className="text-[10px] sm:text-mobile-xs text-center leading-none truncate max-w-full">{label}</span>
  </Link>
)

export default function DashboardScreen() {
  const { t } = useTranslation(['dashboard', 'common'])
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [groups, setGroups] = useState<any[]>([])
  const [totalOwed, setTotalOwed] = useState("$0.00")
  const [totalYouOwe, setTotalYouOwe] = useState("$0.00")
  const [monthExpenses, setMonthExpenses] = useState("$0.00")
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pendingTransactions, setPendingTransactions] = useState(0)
  const [isQuickAddExpenseModalOpen, setIsQuickAddExpenseModalOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<{ id: string; name: string; defaultCurrency?: string } | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const isStandalone = usePWAStandalone()

  // Fonction pour rafraîchir toutes les données
  const refreshData = useCallback(async () => {
    console.log('🔄 REFRESH DATA - Début du rafraîchissement')
    setIsRefreshing(true)
    try {
      await Promise.all([
        fetchGroups(),
        fetchBalances(),
        fetchRecentExpenses()
      ])
      console.log('✅ REFRESH DATA - Rafraîchissement terminé avec succès')
    } catch (error) {
      console.error('❌ REFRESH DATA - Erreur lors du rafraîchissement:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  // Rafraîchir les données quand on revient sur la page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshData()
      }
    }

    const handleFocus = () => {
      refreshData()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [refreshData])

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          router.push("/signin")
          return
        }

        setUser(user)

        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profile) {
          setUserProfile(profile)
        }

      } catch (error) {
        console.error("Erreur lors du chargement des données:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
    fetchBalances()
    fetchRecentExpenses()
    fetchGroups()
  }, [router, supabase])

  const fetchBalances = async () => {
    try {
      console.log('💰 FETCH BALANCES - Début récupération balances')
      const response = await fetch('/api/balances')
      
      // Vérifier le status HTTP
      if (!response.ok) {
        console.error('❌ FETCH BALANCES - Erreur HTTP:', response.status, response.statusText)
        setError(`Erreur HTTP ${response.status}`)
        return
      }
      
      // Vérifier le content-type
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ FETCH BALANCES - Réponse non-JSON:', contentType)
        const text = await response.text()
        console.error('❌ FETCH BALANCES - Contenu de la réponse:', text.substring(0, 200))
        setError('Erreur de format de réponse')
        return
      }
      
      const result = await response.json()
      console.log('💰 FETCH BALANCES - Réponse API balances:', result)
      
      if (result.success) {
        const newOwed = `$${result.data.totalOwed.toFixed(2)}`
        const newYouOwe = `$${result.data.totalYouOwe.toFixed(2)}`
        const newMonthExpenses = `$${result.data.monthExpenses.toFixed(2)}`
        
        console.log('💰 FETCH BALANCES - Mise à jour des états:', {
          ancienOwed: totalOwed,
          nouveauOwed: newOwed,
          ancienYouOwe: totalYouOwe,
          nouveauYouOwe: newYouOwe
        })
        
        setTotalOwed(newOwed)
        setTotalYouOwe(newYouOwe)
        setMonthExpenses(newMonthExpenses)
        setPendingTransactions(result.data.pendingTransactions || 0)
      } else {
        console.error('❌ FETCH BALANCES - Erreur API balances:', result.error)
        setError(result.error)
      }
    } catch (error) {
      console.error('❌ FETCH BALANCES - Erreur récupération balances:', error)
      setError('Erreur de connexion')
    }
  }

  const fetchRecentExpenses = async () => {
    try {
      const response = await fetch('/api/expenses/recent')
      const result = await response.json()
      if (result.success) {
        setRecentActivity(result.data.slice(0, 3)) // Prendre les 3 plus récentes
      }
    } catch (error) {
      console.error('Erreur récupération activité récente:', error)
    }
  }

  const fetchGroups = async () => {
    try {
      console.log('🏠 FETCH GROUPS - Début récupération groupes')
      const response = await fetch('/api/groups')
      
      if (!response.ok) {
        console.error('🏠 FETCH GROUPS - Erreur HTTP:', response.status, response.statusText)
        setGroups([])
        return
      }
      
      const result = await response.json()
      console.log('🏠 FETCH GROUPS - Réponse API complète:', result)
      
      if (result.success && result.data) {
        console.log('🏠 FETCH GROUPS - Groupes trouvés:', result.data.length)
        setGroups(result.data)
      } else if (result.success && result.data?.length === 0) {
        console.log('🏠 FETCH GROUPS - Aucun groupe trouvé (tableau vide)')
        setGroups([])
      } else {
        console.error('🏠 FETCH GROUPS - Erreur dans la réponse:', result.error || 'Format inattendu')
        setGroups([])
      }
    } catch (error) {
      console.error('🏠 FETCH GROUPS - Erreur récupération groupes:', error)
      setGroups([])
    }
  }

  const navItems = [
    { icon: HomeIcon, label: t('common:navigation.dashboard'), active: true, href: "/dashboard" },
    { icon: LayoutGrid, label: t('common:navigation.groups'), href: "/dashboard/groups" },
    { icon: ListChecks, label: t('common:navigation.expenses'), href: "/dashboard/expenses" },
    { icon: Scale, label: t('common:navigation.balances'), href: "/dashboard/settle-up" },
    { icon: User, label: t('common:navigation.profile'), href: "/dashboard/profile" },
  ]

  if (loading) {
    return (
      <div className="w-full max-w-md h-[800px] max-h-[90vh] bg-white shadow-2xl rounded-3xl overflow-hidden flex items-center justify-center">
        <p className="text-gray-500">{t('common:loading')}</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md h-[800px] max-h-[90vh] bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col">
      {!isStandalone && <PWAInstallButton />}
      <header className="p-mobile-md sm:p-mobile-lg flex items-center justify-between border-b">
        <h1 className="text-mobile-lg sm:text-mobile-xl font-bold text-gray-800">BuddyBill</h1>
        <div className="flex items-center gap-mobile-sm sm:gap-mobile-md">
          <div className="relative">
            <Bell className="h-6 w-6 sm:h-7 sm:w-7 text-gray-600" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-mobile-xs w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center">
              0
            </span>
          </div>
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
            <AvatarImage src={userProfile?.avatar_url} alt="User" />
            <AvatarFallback>
              {userProfile?.full_name ? userProfile.full_name.substring(0, 2).toUpperCase() : "??"}
            </AvatarFallback>
          </Avatar>
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0 hover:bg-blue-100 text-blue-600 hover:text-blue-700 touch-target"
            onClick={refreshData}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              <RefreshCw className="h-5 w-5" />
            )}
          </Button>
        </div>
      </header>
      <PullToRefresh onRefresh={refreshData}>
        <ScrollArea className="flex-grow">
          <div className="p-mobile-md sm:p-mobile-lg space-y-mobile-lg sm:space-y-mobile-xl">
            <section>
              <h2 className="text-mobile-base sm:text-mobile-lg font-semibold text-gray-700 mb-mobile-sm">{t('dashboard:overview.title')}</h2>
              <p className="text-mobile-sm text-gray-500 mb-mobile-md">
                {t('dashboard:overview.welcome', { name: userProfile?.full_name || user?.email })}
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
                <SummaryCard title={t('dashboard:overview.owedToYou')} value={totalOwed} icon={DollarSign} bgColor="bg-emerald-50" textColor="text-emerald-700" />
                <SummaryCard title={t('dashboard:overview.youOwe')} value={totalYouOwe} icon={DollarSign} bgColor="bg-rose-50" textColor="text-rose-700" />
                <SummaryCard title={t('dashboard:overview.thisMonth')} value={monthExpenses} icon={CreditCard} />
                <SummaryCard title={t('dashboard:overview.activeGroups')} value={groups.length.toString()} icon={UsersRound} />
                <SummaryCard title={t('dashboard:overview.pending')} value={pendingTransactions?.toString() || "0"} icon={Activity} />
              </div>
            </section>
            <section className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">{t('dashboard:groups.title')}</h3>
              <Card>
                <CardContent className="p-4">
                  {groups.length === 0 ? (
                    <div className="text-center py-6">
                      <UsersRound className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-500 mb-3">{t('dashboard:groups.noGroups')}</p>
                      <Link href="/create-group">
                        <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
                          <Plus className="h-4 w-4 mr-2" />
                          {t('dashboard:quickActions.createGroup')}
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {groups.slice(0, 3).map((group, index) => (
                        <div key={group.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center space-x-3 w-full">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {group.name?.charAt(0)?.toUpperCase() || 'G'}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm text-gray-900">{group.name}</p>
                              <p className="text-xs text-gray-500">{t('dashboard:groups.members', { count: group.memberCount || 0 })}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-blue-100 text-blue-600 hover:text-blue-700"
                              onClick={() => {
                                console.log('🐛 DEBUG groupe sélectionné:', group)
                                console.log('🐛 DEBUG defaultCurrency:', group.defaultCurrency)
                                setSelectedGroup({ id: group.id, name: group.name, defaultCurrency: group.defaultCurrency || 'EUR' })
                                setIsQuickAddExpenseModalOpen(true)
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {groups.length > 3 && (
                        <Link href="/dashboard/groups">
                          <Button variant="outline" size="sm" className="w-full">
                            {t('dashboard:groups.viewAll', { count: groups.length })}
                          </Button>
                        </Link>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
            <section>
              <h3 className="text-mobile-base sm:text-mobile-lg font-semibold mb-mobile-md text-gray-800">{t('dashboard:quickActions.title')}</h3>
              <Card>
                <CardContent className="p-mobile-md sm:p-mobile-lg">
                  <div className="flex flex-col space-y-mobile-md max-w-sm">
                    <Link href="/create-group">
                      <Button className="bg-blue-500 hover:bg-blue-600 text-white min-h-button text-mobile-sm sm:text-mobile-base w-full justify-start touch-target">
                        <UsersRound className="mr-mobile-md h-5 w-5 sm:h-6 sm:w-6" /> {t('dashboard:quickActions.createGroup')}
                      </Button>
                    </Link>
                    <Link href="/join-group">
                      <Button variant="outline" className="text-mobile-sm sm:text-mobile-base min-h-button w-full justify-start touch-target">
                        <PlusCircle className="mr-mobile-md h-5 w-5 sm:h-6 sm:w-6" /> {t('dashboard:quickActions.joinGroup')}
                      </Button>
                    </Link>
                    <Link href="/dashboard/settle-up">
                      <Button variant="outline" className="text-mobile-sm sm:text-mobile-base min-h-button w-full justify-start touch-target">
                        <CheckCircle className="mr-mobile-md h-5 w-5 sm:h-6 sm:w-6" /> {t('dashboard:quickActions.settleUp')}
                      </Button>
                    </Link>
                    <Link href="/dashboard/expenses">
                      <Button variant="outline" className="text-mobile-sm sm:text-mobile-base min-h-button w-full justify-start touch-target">
                        <Receipt className="mr-mobile-md h-5 w-5 sm:h-6 sm:w-6" /> {t('dashboard:quickActions.manageExpenses')}
                      </Button>
                    </Link>
                    <Link href="/dashboard/recent-activity">
                      <Button variant="outline" className="text-mobile-sm sm:text-mobile-base min-h-button w-full justify-start touch-target">
                        <Activity className="mr-mobile-md h-5 w-5 sm:h-6 sm:w-6" /> {t('dashboard:quickActions.viewFullActivity')}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </section>
            <section>
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-base sm:text-lg font-semibold text-gray-700">{t('dashboard:recentActivity.title')}</h2>
                <Link
                  href="/dashboard/recent-activity"
                  className="text-xs sm:text-sm text-primary hover:underline flex items-center"
                >
                  {t('dashboard:recentActivity.viewAll')} <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                </Link>
              </div>
              <Card>
                <CardContent className="p-4">
                  {recentActivity.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center">{t('dashboard:recentActivity.noActivity')}</p>
                  ) : (
                    recentActivity.map((activity, index) => (
                      <React.Fragment key={index}>
                        <div className="px-3 sm:px-4">
                          <ActivityItem {...activity} />
                        </div>
                        {index < recentActivity.length - 1 && <Separator />}
                      </React.Fragment>
                    ))
                  )}
                </CardContent>
              </Card>
            </section>
          </div>
        </ScrollArea>
      </PullToRefresh>
      <nav className="p-mobile-sm sm:p-2 border-t bg-slate-50 grid grid-cols-5 gap-mobile-xs sm:gap-1 min-h-[60px] sm:min-h-[70px]">
        {navItems.map((item) => (
          <NavItem key={item.label} {...item} />
        ))}
      </nav>
      {selectedGroup && (
        <QuickAddExpenseModal
          isOpen={isQuickAddExpenseModalOpen}
          onClose={() => {
            setIsQuickAddExpenseModalOpen(false)
            setSelectedGroup(null)
          }}
          groupId={selectedGroup.id}
          groupName={selectedGroup.name}
          defaultCurrency={selectedGroup.defaultCurrency}
          onSuccess={() => {
            refreshData()
          }}
        />
      )}
    </div>
  )
}
