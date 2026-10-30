export type IdentityColor = 'lavender' | 'sage' | 'apricot' | 'slate-blue'

export const household = {
  name: '毛孩之家',
  petCount: 3,
}

export type StockCategory = {
  name: string
  englishHint?: string
  quantity: number
  unit: string
  opened?: number
}

export type StockSection = {
  key: string
  name: string
  categories: StockCategory[]
}

export const stockSections: StockSection[] = [
  {
    key: 'cat',
    name: '猫',
    categories: [
      { name: '猫粮', quantity: 3, unit: '包', opened: 1 },
      { name: '罐头', quantity: 24, unit: '罐' },
      { name: '餐包餐盒', quantity: 12, unit: '盒' },
      { name: '零食', quantity: 5, unit: '袋' },
      { name: '其他', quantity: 4, unit: '件' },
    ],
  },
  {
    key: 'dog',
    name: '狗',
    categories: [
      { name: '狗粮', quantity: 2, unit: '包', opened: 1 },
      { name: '罐头', quantity: 8, unit: '罐' },
      { name: '零食', quantity: 6, unit: '袋' },
      { name: '其他', quantity: 3, unit: '件' },
    ],
  },
]

export type MonthActivity = {
  section: string
  stockIn: number
  consume: number
}

export const thisMonth: MonthActivity[] = [
  { section: '猫', stockIn: 6, consume: 18 },
  { section: '狗', stockIn: 3, consume: 9 },
]

export type ExpiryStatus = {
  key: 'expired' | 'urgent' | 'attention' | 'safe'
  label: string
  english: string
  count: number
  products: number
}

export const expiry: ExpiryStatus[] = [
  { key: 'expired', label: '已过期', english: 'Expired', count: 2, products: 2 },
  { key: 'urgent', label: '紧急', english: 'Urgent', count: 5, products: 3 },
  {
    key: 'attention',
    label: '关注',
    english: 'Attention',
    count: 11,
    products: 7,
  },
  { key: 'safe', label: '安全', english: 'Safe', count: 63, products: 21 },
]

export type PetCareStatus = 'ok' | 'soon' | 'due'

export type Pet = {
  id: string
  name: string
  type: '猫' | '狗'
  breed: string
  birthday?: string
  sex?: '公' | '母'
  age: string
  color: IdentityColor
  photo: string
  weight: { value: number; agoDays: number }
  deworming: {
    internal: { label: string; status: PetCareStatus }
    external: { label: string; status: PetCareStatus }
  }
  grooming?: {
    bath: string
    trim: string
  }
}

export const pets: Pet[] = [
  {
    id: 'orange',
    name: '橘子',
    type: '猫',
    breed: '英国短毛猫',
    age: '3岁2个月',
    color: 'apricot',
    photo: '/pets/orange.png',
    weight: { value: 5.2, agoDays: 3 },
    deworming: {
      internal: { label: '还有 12 天', status: 'soon' },
      external: { label: '该驱虫了', status: 'due' },
    },
  },
  {
    id: 'mochi',
    name: '麻薯',
    type: '猫',
    breed: '布偶猫',
    age: '1岁8个月',
    color: 'lavender',
    photo: '/pets/mochi.png',
    weight: { value: 4.1, agoDays: 6 },
    deworming: {
      internal: { label: '还有 45 天', status: 'ok' },
      external: { label: '还有 8 天', status: 'soon' },
    },
  },
  {
    id: 'cola',
    name: '可乐',
    type: '狗',
    breed: '柯基',
    age: '2岁5个月',
    color: 'slate-blue',
    photo: '/pets/cola.png',
    weight: { value: 11.3, agoDays: 1 },
    deworming: {
      internal: { label: '还有 20 天', status: 'ok' },
      external: { label: '还有 20 天', status: 'ok' },
    },
    grooming: {
      bath: '5 天前',
      trim: '3 周前',
    },
  },
]
