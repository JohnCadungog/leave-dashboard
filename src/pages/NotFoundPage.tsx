import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center px-4">
      <p className="text-7xl font-bold text-zinc-200 dark:text-zinc-800" aria-hidden="true">
        404
      </p>
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="text-sm text-muted-foreground max-w-sm">
        The page you were looking for doesn't exist or has been moved.
      </p>
      <Button asChild variant="outline">
        <Link to="/dashboard">Go back home</Link>
      </Button>
    </div>
  )
}
