import { cn } from '@/lib/utils'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const variants: Record<BadgeVariant, string> = {
  success: 'bg-domia-primary-bg text-domia-primary',
  warning: 'bg-domia-amber-bg text-domia-amber',
  danger: 'bg-domia-red-bg text-domia-red',
  info: 'bg-domia-blue-bg text-domia-blue',
  neutral: 'bg-gray-100 text-gray-600',
}

interface DomiaBadgeProps {
  variant: BadgeVariant
  children: React.ReactNode
  className?: string
}

export function DomiaBadge({ variant, children, className }: DomiaBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-badge text-xs font-medium font-body',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
