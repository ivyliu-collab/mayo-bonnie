'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'

export type PetHealthInput = {
  petId: string
  type: 'weight' | 'deworming' | 'grooming'
  subtype?: string
  date: string
  value?: number
  unit?: string
  brand?: string
  note?: string
}

export async function savePetHealthRecord(input: PetHealthInput) {
  const supabase = await createSupabaseServerClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('请先登录')
  if (!input.petId || !input.date) throw new Error('请填写日期')
  if (input.type === 'weight' && (!input.value || input.value <= 0)) throw new Error('请输入有效体重')

  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id, role')
    .eq('user_id', userData.user.id)
    .in('role', ['owner', 'editor'])
    .order('created_at')
    .limit(1)
    .maybeSingle()
  if (!membership) throw new Error('没有可写入的家庭')

  const { error: petError } = await supabase
    .from('pets')
    .select('id')
    .eq('id', input.petId)
    .eq('household_id', membership.household_id)
    .maybeSingle()
  if (petError) throw new Error(petError.message)

  const { data, error } = await supabase
    .from('pet_health_records')
    .insert({
      household_id: membership.household_id,
      pet_id: input.petId,
      record_type: input.type,
      subtype: input.subtype?.trim() || null,
      recorded_on: input.date,
      value: input.value ?? null,
      unit: input.unit?.trim() || (input.type === 'weight' ? 'kg' : null),
      brand: input.brand?.trim() || null,
      note: input.note?.trim() || null,
      created_by: userData.user.id,
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return { id: data.id }
}
