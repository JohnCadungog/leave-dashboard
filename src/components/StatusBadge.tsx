import { Badge } from '@/components/ui/badge'
import type { LeaveRequestStatus } from '@/lib/supabase/types'

export function StatusBadge({ status }: { status: LeaveRequestStatus }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  return <Badge variant={status}>{label}</Badge>
}
