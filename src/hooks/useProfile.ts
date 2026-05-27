import { useQuery } from '@tanstack/react-query'
import { fetchProfile } from '@/lib/queries/profiles'
import type { Profile } from '@/lib/supabase/types'

export function useProfile(userId: string | undefined) {
  return useQuery<Profile, Error>({
    queryKey: ['profile', userId],
    queryFn: () => {
      if (!userId) throw new Error('No user ID')
      return fetchProfile(userId)
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}
