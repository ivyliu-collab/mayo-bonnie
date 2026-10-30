'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'

type CreateHouseholdInput = {
  name: string
  pets: Array<{ name: string; type: '猫' | '狗'; breed: string; birthday: string; color: string; photo: string }>
}

export async function createHousehold(input: CreateHouseholdInput) {
  const supabase = await createSupabaseServerClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) throw new Error('请先登录后再创建家庭')
  const { data: existingMembership } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', userData.user.id)
    .limit(1)
    .maybeSingle()
  if (existingMembership) throw new Error('你已经加入了一个家庭，请直接进入首页')
  if (!input.name.trim()) throw new Error('请输入家庭名称')
  if (!input.pets.length || input.pets.some((pet) => !pet.name.trim())) throw new Error('请至少添加一只宠物并填写名字')

  const { data: householdId, error } = await supabase.rpc('create_household_onboarding', {
    p_name: input.name.trim(),
    p_pets: input.pets.map((pet) => ({
      name: pet.name.trim(),
      type: pet.type,
      breed: pet.breed.trim(),
      birthday: pet.birthday,
      color: pet.color,
      photo: pet.photo,
    })),
  })

  if (error) throw new Error(error.message)
  return { householdId }
}
