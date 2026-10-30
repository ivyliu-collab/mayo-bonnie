'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'

async function getWritableContext() {
  const supabase = await createSupabaseServerClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('请先登录')
  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', userData.user.id)
    .in('role', ['owner', 'editor'])
    .order('created_at')
    .limit(1)
    .maybeSingle()
  if (!membership) throw new Error('没有可编辑的家庭')
  return { supabase, userId: userData.user.id, householdId: membership.household_id }
}

export async function updateHouseholdName(name: string) {
  const { supabase, householdId } = await getWritableContext()
  const trimmed = name.trim()
  if (!trimmed || trimmed.length > 80) throw new Error('家庭名称需要为 1–80 个字符')
  const { error } = await supabase.from('households').update({ name: trimmed }).eq('id', householdId)
  if (error) throw new Error(error.message)
}

export type PetSettingsInput = {
  id?: string
  name: string
  type: '猫' | '狗'
  breed?: string
  birthday?: string
  sex?: '公' | '母'
  color?: string
  photoPath?: string
}

export async function savePetSettings(input: PetSettingsInput) {
  const { supabase, userId, householdId } = await getWritableContext()
  if (!input.name.trim()) throw new Error('请输入宠物名字')
  const payload = {
    household_id: householdId,
    name: input.name.trim(),
    type: input.type,
    breed: input.breed?.trim() || null,
    birthday: input.birthday || null,
    sex: input.sex || null,
    color: input.color || 'apricot',
    photo_path: input.photoPath || null,
  }
  const query = input.id && !input.id.startsWith('new-')
    ? supabase.from('pets').update(payload).eq('id', input.id).eq('household_id', householdId)
    : supabase.from('pets').insert(payload).select('id').single()
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return { id: input.id ?? data?.id, userId }
}

export async function archivePet(id: string) {
  const { supabase, householdId } = await getWritableContext()
  const { error } = await supabase.from('pets').update({ archived_at: new Date().toISOString() }).eq('id', id).eq('household_id', householdId)
  if (error) throw new Error(error.message)
}

export type CategorySettingsInput = {
  id?: string
  name: string
  section: '猫' | '狗'
  unit: string
  expiryRequired: boolean
}

export async function saveCategorySettings(input: CategorySettingsInput) {
  const { supabase, householdId } = await getWritableContext()
  if (!input.name.trim() || !input.unit.trim()) throw new Error('请填写分类名称和默认单位')
  const payload = { household_id: householdId, name: input.name.trim(), section: input.section, unit: input.unit.trim(), expiry_required: input.expiryRequired }
  const query = input.id && !input.id.startsWith('new-')
    ? supabase.from('categories').update(payload).eq('id', input.id).eq('household_id', householdId)
    : supabase.from('categories').insert(payload).select('id').single()
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return { id: input.id ?? data?.id }
}

export async function archiveCategory(id: string) {
  const { supabase, householdId } = await getWritableContext()
  const { error } = await supabase.from('categories').update({ archived_at: new Date().toISOString() }).eq('id', id).eq('household_id', householdId)
  if (error) throw new Error(error.message)
}

export type ProductSettingsInput = {
  id: string
  name: string
  brand?: string
  specification?: string
  barcode?: string
  categoryId?: string
}

export async function updateProductSettings(input: ProductSettingsInput) {
  const { supabase, householdId } = await getWritableContext()
  if (!input.name.trim()) throw new Error('请输入商品名称')
  if (input.categoryId) {
    const { data: category } = await supabase.from('categories').select('id').eq('id', input.categoryId).eq('household_id', householdId).maybeSingle()
    if (!category) throw new Error('分类不属于当前家庭')
  }
  const { error } = await supabase
    .from('products')
    .update({
      name: input.name.trim(),
      brand: input.brand?.trim() || null,
      specification: input.specification?.trim() || null,
      barcode: input.barcode?.trim() || null,
      ...(input.categoryId ? { category_id: input.categoryId } : {}),
    })
    .eq('id', input.id)
    .eq('household_id', householdId)
  if (error) throw new Error(error.message)
}

export async function uploadProductImage(formData: FormData) {
  const { supabase, userId, householdId } = await getWritableContext()
  const productId = String(formData.get('productId') ?? '')
  const file = formData.get('file')
  if (!productId || !(file instanceof File) || file.size === 0) throw new Error('请选择图片')
  if (!file.type.startsWith('image/')) throw new Error('只能上传图片文件')
  if (file.size > 5 * 1024 * 1024) throw new Error('图片不能超过 5MB')
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${householdId}/${productId}-${crypto.randomUUID()}.${extension}`
  const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file, { contentType: file.type, upsert: true })
  if (uploadError) throw new Error(uploadError.message)
  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  const { error } = await supabase.from('products').update({ image_path: data.publicUrl }).eq('id', productId).eq('household_id', householdId)
  if (error) throw new Error(error.message)
  return { url: data.publicUrl, userId }
}

export async function archiveProduct(id: string) {
  const { supabase, householdId } = await getWritableContext()
  const { error } = await supabase.from('products').update({ archived_at: new Date().toISOString() }).eq('id', id).eq('household_id', householdId)
  if (error) throw new Error(error.message)
}
