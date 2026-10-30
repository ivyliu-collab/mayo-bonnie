import { getCurrentHouseholdId } from '@/lib/data/household-data'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function StockInLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect('/login')
  if (!(await getCurrentHouseholdId())) redirect('/onboarding')
  return children
}
