import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get('code')?.trim()
  if (!code || !/^[0-9A-Za-z-]{4,64}$/.test(code)) return NextResponse.json({ error: 'invalid_barcode' }, { status: 400 })
  const supabase = await createSupabaseServerClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })

  const { data: household } = await supabase.from('household_members').select('household_id').eq('user_id', userData.user.id).limit(1).maybeSingle()
  if (!household) return NextResponse.json({ error: 'no_household' }, { status: 403 })
  const { data: local } = await supabase
    .from('products')
    .select('id, name, brand, specification, barcode, image_path, categories(name, section, unit)')
    .eq('household_id', household.household_id)
    .eq('barcode', code)
    .is('archived_at', null)
    .maybeSingle()
  if (local) return NextResponse.json({ source: 'household', product: local })

  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=code,product_name,brands,quantity,image_url`, { next: { revalidate: 3600 } })
    if (response.ok) {
      const remote = await response.json()
      if (remote.status === 1 && remote.product?.product_name) {
        return NextResponse.json({
          source: 'external',
          product: {
            barcode: code,
            name: remote.product.product_name,
            brand: remote.product.brands ?? '',
            specification: remote.product.quantity ?? '',
            image_path: remote.product.image_url ?? '',
          },
        })
      }
    }
  } catch {
    // A third-party catalog outage should leave manual entry available.
  }
  return NextResponse.json({ source: 'none', product: null })
}
