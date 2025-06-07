import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface MobileLayoutProps {
  children: ReactNode
  className?: string
  spacing?: 'normal' | 'compact' | 'large'
}

/**
 * Layout wrapper unifié pour toutes les pages de l'application
 * Assure une cohérence responsive sur tous les écrans
 */
export function MobileLayout({ 
  children, 
  className,
  spacing = 'normal'
}: MobileLayoutProps) {
  const spacingClasses = {
    compact: 'space-y-2 px-2 py-2 sm:space-y-3 sm:px-3 sm:py-3',
    normal: 'space-y-3 px-3 py-3 sm:space-y-4 sm:px-4 sm:py-6', 
    large: 'space-y-4 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-8'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={cn(
        "w-full",
        spacingClasses[spacing],
        className
      )}>
        {children}
      </div>
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
      "bg-white rounded-lg shadow-sm",
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  )
}
