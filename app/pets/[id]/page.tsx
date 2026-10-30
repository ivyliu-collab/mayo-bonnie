import { PetDetailScreen } from '@/components/pets/pet-detail-screen'
import { getCurrentHouseholdId, getHouseholdPets, getPetHealthRecords } from '@/lib/data/household-data'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'

export default async function PetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect('/login')
  if (!(await getCurrentHouseholdId())) redirect('/onboarding')

  const { id } = await params
  const pet = (await getHouseholdPets()).find((item) => item.id === id)
  if (!pet) notFound()
  const records = await getPetHealthRecords(id)
  return <PetDetailScreen id={id} initialPet={pet} initialRecords={records} />
}
