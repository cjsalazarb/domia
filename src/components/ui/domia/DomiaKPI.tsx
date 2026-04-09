import { cn } from '@/lib/utils'

interface DomiaKPIProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  className?: string
}

export function DomiaKPI({ label, value, icon, className }: DomiaKPIProps) {
  return (
    <div className={cn('bg-domia-surface rounded-card shadow-sm border border-domia-border/30 p-4', className)}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-button bg-domia-primary-bg text-domia-primary">
            {icon}
          </div>
        )}
        <div>
          <p className="text-2xl font-extrabold font-display text-domia-ink">{value}</p>
          <p className="text-xs font-body text-domia-muted">{label}</p>
        </div>
      </div>
    </div>
  )
}
