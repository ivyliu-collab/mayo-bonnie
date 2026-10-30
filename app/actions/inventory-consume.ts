'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function consumeProduct(productId: string, quantity = 1) {
  const supabase = await createSupabaseServerClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw new Error('请先登录后再消耗库存')
  const { error } = await supabase.rpc('consume_product', { p_product_id: productId, p_quantity: quantity })
  if (error) throw new Error(error.message)
}
