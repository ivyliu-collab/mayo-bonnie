'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function updateInventoryEventNote(eventId: string, note: string) {
  const supabase = await createSupabaseServerClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('请先登录')
  const trimmed = note.trim()
  if (trimmed.length > 200) throw new Error('备注不能超过 200 个字符')
  const { data: membership } = await supabase.from('household_members').select('household_id').eq('user_id', userData.user.id).limit(1).maybeSingle()
  if (!membership) throw new Error('没有加入家庭')
  const { data: event } = await supabase
    .from('inventory_events')
    .select('type')
    .eq('id', eventId)
    .eq('household_id', membership.household_id)
    .maybeSingle()
  if (!event || event.type === 'reverse') throw new Error('这条历史记录不可编辑')
  const { error } = await supabase.from('inventory_events').update({ note: trimmed || null }).eq('id', eventId).eq('household_id', membership.household_id)
  if (error) throw new Error(error.message)
}

export async function reverseInventoryEvent(eventId: string) {
  const supabase = await createSupabaseServerClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('请先登录')
  const { data, error } = await supabase.rpc('reverse_inventory_event', { p_event_id: eventId })
  if (error) throw new Error(error.message)
  return { reverseEventId: data }
}
