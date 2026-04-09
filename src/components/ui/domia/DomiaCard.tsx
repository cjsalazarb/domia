import { cn } from '@/lib/utils'

interface DomiaCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function DomiaCard({ children, className, ...props }: DomiaCardProps) {
  return (
    <div
      className={cn(
        'bg-domia-surface rounded-card shadow-sm border border-domia-border/30 p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
