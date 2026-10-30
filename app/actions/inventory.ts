'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'

export type StockInInput = {
  name: string
  category: string
  section: '猫' | '狗'
  unit: string
  batches: Array<{ expiresOn: string; quantity: number }>
  barcode?: string
  brand?: string
  specification?: string
  imagePath?: string
}

export type StockInCategory = {
  name: string
  section: '猫' | '狗'
  unit: string
}

export async function getStockInCategories(): Promise<StockInCategory[]> {
  const supabase = await createSupabaseServerClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw new Error('请先登录后再读取分类')
  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', userData.user.id)
    .in('role', ['owner', 'editor'])
    .order('created_at')
    .limit(1)
    .maybeSingle()
  if (!membership) throw new Error('没有可编辑的家庭')
  const { data, error } = await supabase
    .from('categories')
    .select('name, section, unit')
    .eq('household_id', membership.household_id)
    .is('archived_at', null)
    .order('section')
    .order('name')
  if (error) throw new Error(error.message)
  return (data ?? []) as StockInCategory[]
}

export async function stockInProduct(input: StockInInput) {
  const supabase = await createSupabaseServerClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw new Error('请先登录后再入库')
  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', userData.user.id)
    .in('role', ['owner', 'editor'])
    .order('created_at')
    .limit(1)
    .maybeSingle()
  if (!membership) throw new Error('没有可编辑的家庭')
  if (!input.name.trim() || !input.category.trim() || !input.unit.trim()) throw new Error('请完整填写商品名称、分类和单位')
  if (!input.batches.length || input.batches.some((batch) => batch.quantity <= 0 || !Number.isFinite(batch.quantity))) {
    throw new Error('请填写有效的库存批次数量')
  }

  let rpcInput = {
    p_name: input.name,
    p_category: input.category,
    p_section: input.section,
    p_unit: input.unit,
    p_batches: input.batches.map((batch) => ({ expires_on: batch.expiresOn, quantity: batch.quantity })),
  }

  // A barcode is a stable product identity. Reuse the household's active
  // product record when it already exists, even if its display name changed.
  if (input.barcode?.trim()) {
    const { data: existingProduct } = await supabase
      .from('products')
      .select('name, categories(name, section, unit)')
      .eq('household_id', membership.household_id)
      .eq('barcode', input.barcode.trim())
      .is('archived_at', null)
      .maybeSingle()
    const category = Array.isArray(existingProduct?.categories) ? existingProduct.categories[0] : existingProduct?.categories
    if (existingProduct && category) {
      rpcInput = {
        ...rpcInput,
        p_name: existingProduct.name,
        p_category: category.name,
        p_section: category.section as '猫' | '狗',
        p_unit: category.unit,
      }
    }
  }

  const { data: productId, error } = await supabase.rpc('stock_in_product', rpcInput)
  if (error) throw new Error(error.message)
  if (productId && (input.barcode || input.brand || input.specification || input.imagePath)) {
    const metadata: Record<string, string | null> = {}
    if (input.barcode !== undefined) metadata.barcode = input.barcode.trim() || null
    if (input.brand !== undefined) metadata.brand = input.brand.trim() || null
    if (input.specification !== undefined) metadata.specification = input.specification.trim() || null
    if (input.imagePath !== undefined) metadata.image_path = input.imagePath.trim() || null
    const { error: metadataError } = await supabase.from('products').update(metadata).eq('id', productId).eq('household_id', membership.household_id)
    if (metadataError) throw new Error(metadataError.message)
  }
  return { productId }
}
