import { cn } from '@/lib/utils'

type TextareaProps = React.ComponentPropsWithoutRef<'textarea'>

function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full resize-none rounded-lg border border-input bg-card/70 px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground hover:bg-accent/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-950/40',
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
