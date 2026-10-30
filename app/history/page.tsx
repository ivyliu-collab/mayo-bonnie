import { HistoryScreen } from '@/components/history/history-screen'
import { getCurrentHouseholdId, getInventoryHistory } from '@/lib/data/household-data'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

type HistoryPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const supabase = await createSupabaseServerClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) redirect('/login')
  if (!(await getCurrentHouseholdId())) redirect('/onboarding')

  const params = await searchParams
  const tab = typeof params.tab === 'string' ? params.tab : undefined
  const section = typeof params.section === 'string' ? params.section : undefined
  const product = typeof params.product === 'string' ? params.product : undefined
  const records = await getInventoryHistory()
  return <HistoryScreen records={records} initialTab={tab} initialSection={section} initialProduct={product} />
}
