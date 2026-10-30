import { SettingsScreen } from '@/components/settings/settings-screen'
import { getCatalogProducts, getCurrentHouseholdId, getHouseholdPets, getHouseholdSections, getHouseholdSettingsData } from '@/lib/data/household-data'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Page() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect('/login')
  if (!(await getCurrentHouseholdId())) redirect('/onboarding')

  const [household, pets, sections, catalog] = await Promise.all([
    getHouseholdSettingsData(),
    getHouseholdPets(),
    getHouseholdSections(),
    getCatalogProducts(),
  ])
  return <SettingsScreen initialHousehold={household} initialPets={pets} initialSections={sections} initialCatalog={catalog} />
}
