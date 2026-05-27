import { supabase } from '@/lib/supabase/client'
import type { Profile } from '@/lib/supabase/types'

export async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()

  if (error) throw error
  return data
}
