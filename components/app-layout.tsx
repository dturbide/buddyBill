import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import AppHeader from './app-header'
import BottomNavigation from './bottom-navigation'
import { ScrollArea } from "@/components/ui/scroll-area"

interface AppLayoutProps {
  children: ReactNode
  className?: string
  spacing?: 'normal' | 'compact' | 'large'
  title?: string
  showBackButton?: boolean
  backHref?: string
  showNavigation?: boolean
}

/**
 * Layout complet de l'application avec header et navigation
 * À utiliser pour toutes les pages qui ont besoin de la navigation
 */
export function AppLayout({ 
  children, 
  className,
  spacing = 'normal',
  title,
  showBackButton = false,
  backHref = "/dashboard",
  showNavigation = true
}: AppLayoutProps) {
  const spacingClasses = {
    compact: 'space-y-2 px-2 py-2 sm:space-y-3 sm:px-3 sm:py-3',
    normal: 'space-y-3 px-3 py-3 sm:space-y-4 sm:px-4 sm:py-4', 
    large: 'space-y-4 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6'
  }

  return (
    <div className="w-full max-w-md h-[800px] max-h-[90vh] bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col mx-auto">
      <AppHeader 
        title={title} 
        showBackButton={showBackButton} 
        backHref={backHref} 
      />
      
      <ScrollArea className="flex-1">
        <div className={cn(
          "min-h-full",
          spacingClasses[spacing],
          className
        )}>
          {children}
        </div>
      </ScrollArea>
      
      {showNavigation && <BottomNavigation />}
    </div>
  )
}

interface MobileCardProps {
  children: ReactNode
  className?: string
  padding?: 'small' | 'normal' | 'large'
}

/**
 * Carte responsive uniforme pour tous les composants
 */
export function MobileCard({ 
  children, 
  className,
  padding = 'normal' 
}: MobileCardProps) {
  const paddingClasses = {
    small: 'p-2 sm:p-3',
    normal: 'p-3 sm:p-4',
    large: 'p-4 sm:p-6'
  }

  return (
    <div className={cn(
      "bg-white rounded-lg shadow-sm border",
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  )
}
