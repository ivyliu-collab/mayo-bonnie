import { ProductDetailScreen } from '@/components/inventory/product-detail-screen'
import { getCurrentHouseholdId, getInventoryProductDetail } from '@/lib/data/household-data'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect('/login')
  if (!(await getCurrentHouseholdId())) redirect('/onboarding')

  const { id } = await params
  const product = await getInventoryProductDetail(id)
  if (!product) notFound()
  return <ProductDetailScreen id={id} initialProduct={product} />
}
