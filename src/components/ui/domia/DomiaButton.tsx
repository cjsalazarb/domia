import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-domia-primary hover:bg-domia-primary/90 text-white shadow-sm',
  secondary: 'bg-domia-primary-bg hover:bg-domia-primary-bg/80 text-domia-primary',
  danger: 'bg-domia-red hover:bg-domia-red/90 text-white',
  ghost: 'hover:bg-domia-primary-bg text-domia-muted',
}

interface DomiaButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
  children: React.ReactNode
}

export function DomiaButton({
  variant = 'primary',
  loading = false,
  children,
  className,
  disabled,
  ...props
}: DomiaButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-button px-4 py-2.5 text-sm font-semibold font-display transition-colors disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}
