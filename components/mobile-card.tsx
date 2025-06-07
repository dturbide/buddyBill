import { cn } from '@/lib/utils'

interface MobileCardProps {
  children: React.ReactNode
  className?: string
}

export function MobileCard({ children, className }: MobileCardProps) {
  return (
    <div className={cn(
      "bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden",
      className
    )}>
      {children}
    </div>
  )
}

export default MobileCard
