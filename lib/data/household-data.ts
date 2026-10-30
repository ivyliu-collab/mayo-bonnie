import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { InventoryProduct, InventoryProductDetail } from '@/lib/inventory-data'
import type { Pet, StockSection } from '@/lib/mock-data'
import type { CatalogProduct, CategoryConfig, SectionConfig } from '@/lib/settings-data'

export async function getCurrentHouseholdId() {
  const supabase = await createSupabaseServerClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return null

  const { data } = await supabase
    .from('household_members')
    .select('household_id, created_at')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  return data?.household_id ?? null
}

function expiryState(expiresOn: string | null, quantity: number) {
  if (!expiresOn) return { status: 'no-expiry' as const, label: '无效期' }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(`${expiresOn}T00:00:00`)
  const days = Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000)
  if (days < 0) return { status: 'attention' as const, label: '已过期' }
  if (days <= 30) return { status: 'attention' as const, label: '关注' }
  return { status: 'safe' as const, label: quantity > 0 ? '安全' : '无库存' }
}

export async function getInventoryProducts(): Promise<InventoryProduct[]> {
  const householdId = await getCurrentHouseholdId()
  if (!householdId) return []
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('products')
    .select('id, name, image_path, categories(name, section, unit), inventory_batches(quantity, opened_quantity, expires_on, unit)')
    .eq('household_id', householdId)
    .is('archived_at', null)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map((product) => {
    const category = Array.isArray(product.categories) ? product.categories[0] : product.categories
    const batches = Array.isArray(product.inventory_batches) ? product.inventory_batches : []
    const quantity = batches.reduce((sum, batch) => sum + Number(batch.quantity ?? 0), 0)
    const opened = batches.reduce((sum, batch) => sum + Number(batch.opened_quantity ?? 0), 0)
    const datedBatches = batches.filter((batch) => batch.expires_on).sort((a, b) => String(a.expires_on).localeCompare(String(b.expires_on)))
    const nearestExpiry = datedBatches[0]?.expires_on ?? null
    const state = expiryState(nearestExpiry, quantity)
    const section = category?.section === '狗' ? '狗' : '猫'
    const accent = section === '猫' ? 'lavender' : 'slate-blue'
    const image = product.image_path || (section === '猫' ? '/products/cat-food.png' : '/products/dog-food.png')

    return {
      id: product.id,
      name: product.name,
      category: category?.name ?? '其他',
      section,
      image,
      quantity,
      unit: batches[0]?.unit ?? category?.unit ?? '件',
      status: state.status,
      statusLabel: state.label,
      expiry: nearestExpiry ?? undefined,
      accent,
    }
  })
}

export async function getInventoryProductDetail(id: string): Promise<InventoryProductDetail | null> {
  const householdId = await getCurrentHouseholdId()
  if (!householdId) return null

  const supabase = await createSupabaseServerClient()
  const [{ data: product, error: productError }, { data: events }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, brand, specification, image_path, categories(name, section, unit), inventory_batches(id, quantity, opened_quantity, expires_on, unit, created_at)')
      .eq('id', id)
      .eq('household_id', householdId)
      .is('archived_at', null)
      .maybeSingle(),
    supabase
      .from('inventory_events')
      .select('type, quantity, created_at, inventory_batches(unit)')
      .eq('product_id', id)
      .eq('household_id', householdId)
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  if (productError || !product) return null
  const category = Array.isArray(product.categories) ? product.categories[0] : product.categories
  const batches = Array.isArray(product.inventory_batches) ? product.inventory_batches : []
  const quantity = batches.reduce((sum, batch) => sum + Number(batch.quantity ?? 0), 0)
  const openedQuantity = batches.reduce((sum, batch) => sum + Number(batch.opened_quantity ?? 0), 0)
  const section = category?.section === '狗' ? '狗' : '猫'
  const accent = section === '猫' ? 'lavender' : 'slate-blue'
  const datedBatches = batches
    .filter((batch) => batch.expires_on)
    .sort((a, b) => String(a.expires_on).localeCompare(String(b.expires_on)))
  const image = product.image_path || (section === '猫' ? '/products/cat-food.png' : '/products/dog-food.png')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiryRows = datedBatches.map((batch) => {
    const expiry = new Date(`${batch.expires_on}T00:00:00`)
    const days = Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000)
    return {
      date: String(batch.expires_on).replaceAll('-', '/'),
      quantity: Number(batch.quantity ?? 0),
      tone: days < 0 ? 'urgent' as const : days <= 30 ? 'attention' as const : 'safe' as const,
    }
  })
  const nearestExpiry = datedBatches[0]?.expires_on ?? null
  const nearestDays = nearestExpiry
    ? Math.ceil((new Date(`${nearestExpiry}T00:00:00`).getTime() - today.getTime()) / 86_400_000)
    : null
  const status = nearestDays === null ? 'no-expiry' as const : nearestDays <= 30 ? 'attention' as const : 'safe' as const
  const eventLabels: Record<string, string> = { stock_in: '入库', consume: '消耗', open: '开袋', adjust: '调整', reverse: '撤销' }
  const history = (events ?? []).map((event) => {
    const date = new Date(event.created_at)
    const sign = event.type === 'stock_in' ? '+' : event.type === 'consume' || event.type === 'reverse' ? '−' : ''
    const eventBatch = Array.isArray(event.inventory_batches) ? event.inventory_batches[0] : event.inventory_batches
    return `${date.toLocaleDateString('zh-CN')} · ${eventLabels[event.type] ?? '调整'} ${sign}${event.quantity} ${eventBatch?.unit ?? category?.unit ?? '件'}`
  })

  return {
    id: product.id,
    name: product.name,
    category: category?.name ?? '其他',
    section,
    image,
    quantity,
    unit: batches[0]?.unit ?? category?.unit ?? '件',
    status,
    statusLabel: status === 'attention' ? '关注' : status === 'safe' ? '安全' : '无效期',
    expiry: nearestExpiry ? String(nearestExpiry).replaceAll('-', '.') : undefined,
    accent,
    brand: product.brand ?? '未记录品牌',
    specification: product.specification ?? `${batches[0]?.unit ?? category?.unit ?? '件'} · 家庭库存`,
    remaining: openedQuantity > 0 && quantity > 0 ? Math.round(Math.min(100, (openedQuantity / quantity) * 100)) : undefined,
    history,
    expiryRows,
  }
}

export async function getHouseholdPets(): Promise<Pet[]> {
  const householdId = await getCurrentHouseholdId()
  if (!householdId) return []
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from('pets').select('id, name, type, breed, birthday, sex, color, photo_path').eq('household_id', householdId).is('archived_at', null).order('created_at')
  if (error || !data) return []

  return data.map((pet) => ({
    id: pet.id,
    name: pet.name,
    type: pet.type,
    breed: pet.breed ?? '尚未填写品种',
    birthday: pet.birthday ?? undefined,
    sex: pet.sex === '公' || pet.sex === '母' ? pet.sex : undefined,
    age: pet.birthday ? `${new Date().getFullYear() - new Date(`${pet.birthday}T00:00:00`).getFullYear()}岁` : '年龄未记录',
    color: (['lavender', 'sage', 'apricot', 'slate-blue'].includes(pet.color) ? pet.color : 'apricot') as Pet['color'],
    photo: pet.photo_path || '/pets/orange.png',
    weight: { value: 0, agoDays: 0 },
    deworming: { internal: { label: '暂无记录', status: 'ok' }, external: { label: '暂无记录', status: 'ok' } },
  }))
}

export type PetHealthRecord = {
  id: string
  petId: string
  type: 'weight' | 'deworming' | 'grooming'
  subtype: string
  date: string
  value: number | null
  unit: string
  brand: string
  note: string
}

export async function getPetHealthRecords(petId: string): Promise<PetHealthRecord[]> {
  const householdId = await getCurrentHouseholdId()
  if (!householdId) return []
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('pet_health_records')
    .select('id, pet_id, record_type, subtype, recorded_on, value, unit, brand, note')
    .eq('household_id', householdId)
    .eq('pet_id', petId)
    .order('recorded_on', { ascending: false })
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map((record) => ({
    id: record.id,
    petId: record.pet_id,
    type: record.record_type,
    subtype: record.subtype ?? '',
    date: record.recorded_on,
    value: record.value === null ? null : Number(record.value),
    unit: record.unit ?? '',
    brand: record.brand ?? '',
    note: record.note ?? '',
  }))
}

export type HouseholdSettingsData = {
  id: string
  name: string
}

export async function getHouseholdSettingsData(): Promise<HouseholdSettingsData | null> {
  const householdId = await getCurrentHouseholdId()
  if (!householdId) return null
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('households').select('id, name').eq('id', householdId).maybeSingle()
  return data ?? null
}

const categoryIcons: Record<string, string> = { 猫粮: '🍚', 狗粮: '🍚', 罐头: '🥫', 零食: '🍢', 餐包餐盒: '📦', 其他: '✨' }

export async function getHouseholdSections(): Promise<SectionConfig[]> {
  const householdId = await getCurrentHouseholdId()
  if (!householdId) return []
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, section, unit, expiry_required')
    .eq('household_id', householdId)
    .is('archived_at', null)
    .order('section')
    .order('name')
  if (error || !data) return []
  return (['猫', '狗'] as const).map((section) => ({
    key: section === '猫' ? 'cat' : 'dog',
    name: section,
    color: section === '猫' ? 'apricot' : 'slate-blue',
    categories: data.filter((category) => category.section === section).map((category) => ({
      id: category.id,
      name: category.name,
      icon: categoryIcons[category.name] ?? '✨',
      unit: category.unit,
      expiryRequired: category.expiry_required,
      supportsProgress: false,
    })),
  }))
}

export async function getCatalogProducts(): Promise<CatalogProduct[]> {
  const householdId = await getCurrentHouseholdId()
  if (!householdId) return []
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('products')
    .select('id, name, brand, specification, barcode, image_path, archived_at, category_id, categories(name), inventory_batches(quantity)')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map((product) => {
    const category = Array.isArray(product.categories) ? product.categories[0] : product.categories
    const batches = Array.isArray(product.inventory_batches) ? product.inventory_batches : []
    return {
      id: product.id,
      categoryId: product.category_id,
      name: product.name,
      brand: product.brand ?? '',
      specification: product.specification ?? '',
      category: category?.name ?? '其他',
      image: product.image_path || '/products/treats.png',
      stock: batches.reduce((sum, batch) => sum + Number(batch.quantity ?? 0), 0),
      archived: Boolean(product.archived_at),
    }
  })
}

export function groupInventoryBySection(products: InventoryProduct[]): StockSection[] {
  return (['猫', '狗'] as const).map((section) => {
    const scoped = products.filter((product) => product.section === section)
    const categories = Array.from(new Set(scoped.map((product) => product.category))).map((name) => {
      const items = scoped.filter((product) => product.category === name)
      return { name, quantity: items.reduce((total, item) => total + item.quantity, 0), unit: items[0]?.unit ?? '件' }
    })
    return { key: section === '猫' ? 'cat' : 'dog', name: section, categories }
  })
}

export type MonthAction = { section: string; stockIn: number; consume: number }

export async function getThisMonthActions(): Promise<MonthAction[]> {
  const householdId = await getCurrentHouseholdId()
  if (!householdId) return [{ section: '猫', stockIn: 0, consume: 0 }, { section: '狗', stockIn: 0, consume: 0 }]
  const supabase = await createSupabaseServerClient()
  const start = new Date()
  start.setDate(1)
  start.setHours(0, 0, 0, 0)
  const { data, error } = await supabase
    .from('inventory_events')
    .select('type, products(categories(section))')
    .eq('household_id', householdId)
    .gte('created_at', start.toISOString())
  if (error || !data) return [{ section: '猫', stockIn: 0, consume: 0 }, { section: '狗', stockIn: 0, consume: 0 }]

  return (['猫', '狗'] as const).map((section) => {
    const scoped = data.filter((event) => {
      const product = Array.isArray(event.products) ? event.products[0] : event.products
      const category = product && (Array.isArray(product.categories) ? product.categories[0] : product.categories)
      return category?.section === section
    })
    return {
      section,
      stockIn: scoped.filter((event) => event.type === 'stock_in').length,
      consume: scoped.filter((event) => event.type === 'consume').length,
    }
  })
}

export type ExpirySummary = {
  key: 'expired' | 'urgent' | 'attention' | 'safe'
  label: string
  count: number
  products: number
}

export async function getExpirySummary(): Promise<ExpirySummary[]> {
  const householdId = await getCurrentHouseholdId()
  if (!householdId) return []
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('inventory_batches')
    .select('quantity, expires_on, product_id')
    .eq('household_id', householdId)
    .gt('quantity', 0)
  if (error || !data) return []

  const totals = new Map<ExpirySummary['key'], { count: number; products: Set<string> }>([
    ['expired', { count: 0, products: new Set() }],
    ['urgent', { count: 0, products: new Set() }],
    ['attention', { count: 0, products: new Set() }],
    ['safe', { count: 0, products: new Set() }],
  ])
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (const batch of data) {
    const days = batch.expires_on
      ? Math.ceil((new Date(`${batch.expires_on}T00:00:00`).getTime() - today.getTime()) / 86_400_000)
      : 9999
    const key: ExpirySummary['key'] = days < 0 ? 'expired' : days <= 7 ? 'urgent' : days <= 30 ? 'attention' : 'safe'
    const total = totals.get(key)!
    total.count += Number(batch.quantity ?? 0)
    total.products.add(batch.product_id)
  }
  return [
    { key: 'expired', label: '已过期', count: totals.get('expired')!.count, products: totals.get('expired')!.products.size },
    { key: 'urgent', label: '7天内', count: totals.get('urgent')!.count, products: totals.get('urgent')!.products.size },
    { key: 'attention', label: '30天内', count: totals.get('attention')!.count, products: totals.get('attention')!.products.size },
    { key: 'safe', label: '安全', count: totals.get('safe')!.count, products: totals.get('safe')!.products.size },
  ]
}

export type HistoryRecord = {
  id: string
  date: string
  time: string
  type: '入库' | '消耗' | '开袋' | '过期' | '调整'
  section: '猫' | '狗'
  pet: string
  product: string
  detail: string
  note: string
  tone: string
  edited?: boolean
  reverted?: boolean
  eventType: string
  canEdit: boolean
  canReverse: boolean
}

const eventLabels: Record<string, HistoryRecord['type']> = {
  stock_in: '入库',
  consume: '消耗',
  open: '开袋',
  adjust: '调整',
  reverse: '调整',
}

export async function getInventoryHistory(): Promise<HistoryRecord[]> {
  const householdId = await getCurrentHouseholdId()
  if (!householdId) return []
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('inventory_events')
    .select('id, type, quantity, created_at, note, reversed_at, products(name, categories(section)), inventory_batches(unit)')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error || !data) return []
  return data.map((event) => {
    const product = Array.isArray(event.products) ? event.products[0] : event.products
    const category = product && (Array.isArray(product.categories) ? product.categories[0] : product.categories)
    const section = category?.section === '狗' ? '狗' : '猫'
    const type = eventLabels[event.type] ?? '调整'
    const date = new Date(event.created_at)
    const sign = event.type === 'stock_in' ? '+' : event.type === 'consume' || event.type === 'reverse' ? '−' : ''
    return {
      id: event.id,
      date: date.toLocaleDateString('zh-CN'),
      time: date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      type,
      section,
      pet: section,
      product: product?.name ?? '未命名商品',
      detail: `${sign}${event.quantity} ${event.inventory_batches?.[0]?.unit ?? '件'}`,
      note: event.note ?? type,
      tone: section === '猫' ? 'bg-apricot/30' : 'bg-slate-blue/25',
      eventType: event.type,
      canEdit: event.type !== 'reverse',
      canReverse: ['stock_in', 'consume'].includes(event.type) && !event.reversed_at,
      reverted: Boolean(event.reversed_at),
    }
  })
}
