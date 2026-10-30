import type { IdentityColor } from './mock-data'

export const householdSettings = {
  name: '毛孩之家',
  id: 'PH-7X29KQ',
}

export const identityColorOptions: IdentityColor[] = ['lavender', 'sage', 'apricot', 'slate-blue']

export type PetProfile = {
  id: string
  name: string
  type: '猫' | '狗'
  breed: string
  sex: '公' | '母'
  birthday: string
  color: IdentityColor
  photo: string
  archived?: boolean
}

export const petProfiles: PetProfile[] = [
  { id: 'orange', name: '橘子', type: '猫', breed: '英国短毛猫', sex: '母', birthday: '2023-07-02', color: 'apricot', photo: '/pets/orange.png' },
  { id: 'mochi', name: '麻薯', type: '猫', breed: '布偶猫', sex: '母', birthday: '2025-01-10', color: 'lavender', photo: '/pets/mochi.png' },
  { id: 'cola', name: '可乐', type: '狗', breed: '柯基', sex: '公', birthday: '2024-04-18', color: 'slate-blue', photo: '/pets/cola.png' },
]

export const archivedPetProfiles: PetProfile[] = []

export type CategoryConfig = {
  id: string
  name: string
  icon: string
  unit: string
  expiryRequired: boolean
  supportsProgress: boolean
  archived?: boolean
}

export type SectionConfig = {
  key: string
  name: '猫' | '狗'
  color: IdentityColor
  categories: CategoryConfig[]
}

export const inventorySections: SectionConfig[] = [
  {
    key: 'cat',
    name: '猫',
    color: 'apricot',
    categories: [
      { id: 'cat-can', name: '罐头', icon: '🥫', unit: '罐', expiryRequired: true, supportsProgress: false },
      { id: 'cat-pouch', name: '餐包餐盒', icon: '📦', unit: '盒', expiryRequired: true, supportsProgress: false },
      { id: 'cat-food', name: '猫粮', icon: '🍚', unit: '包', expiryRequired: true, supportsProgress: true },
      { id: 'cat-treat', name: '零食', icon: '🍢', unit: '袋', expiryRequired: true, supportsProgress: false },
      { id: 'cat-other', name: '其他', icon: '✨', unit: '件', expiryRequired: false, supportsProgress: false },
    ],
  },
  {
    key: 'dog',
    name: '狗',
    color: 'slate-blue',
    categories: [
      { id: 'dog-food', name: '狗粮', icon: '🍚', unit: '包', expiryRequired: true, supportsProgress: true },
      { id: 'dog-can', name: '罐头', icon: '🥫', unit: '罐', expiryRequired: true, supportsProgress: false },
      { id: 'dog-treat', name: '零食', icon: '🍢', unit: '袋', expiryRequired: true, supportsProgress: false },
      { id: 'dog-other', name: '其他', icon: '✨', unit: '件', expiryRequired: false, supportsProgress: false },
    ],
  },
]

export type CatalogProduct = {
  id: string
  categoryId?: string
  name: string
  brand: string
  specification: string
  barcode?: string
  category: string
  image: string
  stock: number
  archived?: boolean
}

export const catalogProducts: CatalogProduct[] = [
  { id: 'cat-food', name: '鲜肉全价猫粮', brand: 'Ziwi Peak', specification: '1kg', category: '猫粮', image: '/products/cat-food.png', stock: 3 },
  { id: 'wet-food', name: '深海鱼肉主食罐', brand: 'Applaws', specification: '85g', category: '罐头', image: '/products/wet-food.png', stock: 24 },
  { id: 'dog-food', name: '低敏鸡肉犬粮', brand: 'NOW Fresh', specification: '2.5kg', category: '狗粮', image: '/products/dog-food.png', stock: 2 },
  { id: 'treats', name: '冻干鸡肉小零食', brand: 'PureBites', specification: '100g', category: '零食', image: '/products/treats.png', stock: 6 },
  { id: 'dental-chews', name: '洁齿磨牙棒', brand: 'Greenies', specification: '10支', category: '其他', image: '/products/treats.png', stock: 3 },
  { id: 'old-can', name: '金枪鱼汤罐', brand: 'Ciao', specification: '40g', category: '罐头', image: '/products/wet-food.png', stock: 0 },
]
