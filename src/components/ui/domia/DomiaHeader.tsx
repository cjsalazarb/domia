import { cn } from '@/lib/utils'

interface DomiaHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function DomiaHeader({ children, className, ...props }: DomiaHeaderProps) {
  return (
    <div
      className={cn(
        'bg-gradient-to-r from-domia-primary to-domia-primary-light text-white px-6 py-5 rounded-card',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
