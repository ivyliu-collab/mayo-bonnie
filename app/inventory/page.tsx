import { InventoryScreen } from '@/components/inventory/inventory-screen'
import { getCurrentHouseholdId, getInventoryProducts } from '@/lib/data/household-data'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function InventoryPage() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect('/login')
  if (!(await getCurrentHouseholdId())) redirect('/onboarding')

  const products = await getInventoryProducts()
  return <InventoryScreen initialProducts={products} />
}
