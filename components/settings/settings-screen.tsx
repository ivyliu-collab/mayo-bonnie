'use client'

import Link from 'next/link'
import { useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Archive, ArrowLeft, Barcode, ChevronRight, Edit3, LogOut, Plus, Search, X } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { archiveCategory, archivePet, archiveProduct, saveCategorySettings, savePetSettings, updateHouseholdName, updateProductSettings, uploadProductImage } from '@/app/actions/settings'
import type { HouseholdSettingsData } from '@/lib/data/household-data'
import type { IdentityColor, Pet } from '@/lib/mock-data'
import type { CatalogProduct, CategoryConfig, SectionConfig } from '@/lib/settings-data'

const identityDot: Record<IdentityColor, string> = { lavender: 'bg-lavender', sage: 'bg-sage', apricot: 'bg-apricot', 'slate-blue': 'bg-slate-blue' }
const identityChip: Record<IdentityColor, string> = { lavender: 'bg-lavender/20 text-lavender-foreground', sage: 'bg-sage/20 text-sage-foreground', apricot: 'bg-apricot/25 text-apricot-foreground', 'slate-blue': 'bg-slate-blue/20 text-slate-blue-foreground' }
type GroupKey = 'household' | 'pets' | 'inventory' | 'catalog'
const groups: { key: GroupKey; label: string }[] = [{ key: 'household', label: '家庭' }, { key: 'pets', label: '宠物' }, { key: 'inventory', label: '库存分类' }, { key: 'catalog', label: '商品库' }]

type SettingsProps = {
  initialHousehold: HouseholdSettingsData | null
  initialPets: Pet[]
  initialSections: SectionConfig[]
  initialCatalog: CatalogProduct[]
}

export function SettingsScreen({ initialHousehold, initialPets, initialSections, initialCatalog }: SettingsProps) {
  const [group, setGroup] = useState<GroupKey>('household')
  return <div className="min-h-dvh bg-background pb-16"><header className="border-b border-border/45 bg-background/80 backdrop-blur-md"><div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-5 md:px-8 md:py-6"><Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="size-4" />返回</Link><h1 className="ml-1 text-lg font-medium text-foreground">设置</h1></div></header><main className="mx-auto max-w-3xl px-4 pt-5 md:px-8 md:pt-7"><div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">{groups.map((item) => <button key={item.key} type="button" onClick={() => setGroup(item.key)} className={`shrink-0 rounded-full px-4 py-2 text-sm transition-colors ${group === item.key ? 'bg-foreground text-background' : 'bg-card text-muted-foreground ring-1 ring-border/70 hover:bg-secondary'}`}>{item.label}</button>)}</div><div className="mt-5">{group === 'household' && <HouseholdGroup household={initialHousehold} />}{group === 'pets' && <PetsGroup initialPets={initialPets} />}{group === 'inventory' && <InventoryGroup initialSections={initialSections} />}{group === 'catalog' && <CatalogGroup initialCatalog={initialCatalog} sections={initialSections} />}</div></main></div>
}

function Card({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return <section className="rounded-[24px] bg-card p-5 ring-1 ring-border/60"><div className="mb-4"><h2 className="text-base font-medium text-foreground">{title}</h2>{hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}</div>{children}</section>
}

function Field({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return <label className="text-sm text-muted-foreground">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-1 w-full rounded-xl bg-background p-3 text-sm text-foreground ring-1 ring-border/70 outline-none" /></label>
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 p-3 backdrop-blur-[2px] md:items-center"><div className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-[28px] bg-card p-5 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-lg font-medium text-foreground">{title}</h2><button type="button" aria-label="关闭" onClick={onClose} className="text-muted-foreground"><X className="size-5" /></button></div><div className="mt-5">{children}</div></div></div>
}

function HouseholdGroup({ household }: { household: HouseholdSettingsData | null }) {
  const router = useRouter()
  const [name, setName] = useState(household?.name ?? '')
  const [editing, setEditing] = useState(false)
  const [sheet, setSheet] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  async function saveName() {
    setSaving(true)
    try { await updateHouseholdName(name); setEditing(false); setMessage('家庭名称已保存'); router.refresh() } catch (cause) { setMessage(cause instanceof Error ? cause.message : '保存失败') } finally { setSaving(false) }
  }
  async function signOut() {
    setSaving(true)
    await createSupabaseBrowserClient().auth.signOut()
    router.replace('/login')
    router.refresh()
  }
  return <Card title="家庭" hint="所有家人共享同一个库存与宠物档案"><div className="flex flex-col">{editing ? <div className="flex items-center justify-between gap-3 border-b border-border/60 py-3.5"><span className="text-sm">家庭名称</span><div className="flex items-center gap-2"><input value={name} onChange={(event) => setName(event.target.value)} className="w-36 rounded-xl bg-background px-3 py-1.5 text-right text-sm ring-1 ring-border/70 outline-none" /><button type="button" disabled={saving} onClick={saveName} className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50">保存</button></div></div> : <button type="button" onClick={() => setEditing(true)} className="flex w-full items-center justify-between border-b border-border/60 py-3.5 text-left"><span className="text-sm">家庭名称</span><span className="flex items-center gap-1 text-sm text-muted-foreground">{name}<ChevronRight className="size-4" /></span></button>}<div className="flex items-center justify-between border-b border-border/60 py-3.5 text-sm"><span>家庭 ID</span><span className="font-mono text-xs text-muted-foreground">{household?.id ?? '—'}</span></div><button type="button" onClick={() => setSheet(true)} className="flex w-full items-center justify-between py-3.5 text-left text-sm text-expired">退出登录<ChevronRight className="size-4 text-muted-foreground" /></button></div>{message && <p className="mt-3 text-sm text-safe-foreground" role="status">{message}</p>}{sheet && <Modal title="退出登录" onClose={() => setSheet(false)}><p className="text-sm text-muted-foreground">退出后家庭数据不会删除，下次使用同一个邮箱登录即可继续访问。</p><button type="button" disabled={saving} onClick={signOut} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-expired-soft py-3 text-sm font-medium text-expired disabled:opacity-50"><LogOut className="size-4" />确认退出登录</button></Modal>}</Card>
}

type PetForm = { id?: string; name: string; type: '猫' | '狗'; breed: string; birthday: string; sex: '公' | '母'; color: IdentityColor; photo: string }
function petToForm(pet: Pet): PetForm { return { id: pet.id, name: pet.name, type: pet.type, breed: pet.breed, birthday: pet.birthday ?? '', sex: pet.sex ?? (pet.type === '猫' ? '母' : '公'), color: pet.color, photo: pet.photo } }

function PetsGroup({ initialPets }: { initialPets: Pet[] }) {
  const [pets, setPets] = useState(() => initialPets.map(petToForm))
  const [editing, setEditing] = useState<PetForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  async function save() {
    if (!editing) return
    setSaving(true)
    try { const result = await savePetSettings(editing); const saved = { ...editing, id: result.id ?? editing.id }; setPets((current) => current.some((pet) => pet.id === editing.id) ? current.map((pet) => pet.id === editing.id ? saved : pet) : [...current, saved]); setEditing(null); setMessage('宠物档案已保存') } catch (cause) { setMessage(cause instanceof Error ? cause.message : '保存失败') } finally { setSaving(false) }
  }
  async function archive() { if (!editing?.id || editing.id.startsWith('new-')) return; setSaving(true); try { await archivePet(editing.id); setPets((current) => current.filter((pet) => pet.id !== editing.id)); setEditing(null); setMessage('宠物已归档') } catch (cause) { setMessage(cause instanceof Error ? cause.message : '归档失败') } finally { setSaving(false) } }
  return <><Card title="宠物档案" hint="每只宠物独立管理身份颜色与资料"><div className="flex flex-col gap-3">{pets.map((pet) => <div key={pet.id} className="flex items-center gap-3 rounded-2xl bg-background/60 p-3"><img src={pet.photo || '/pets/orange.png'} alt={`${pet.name}的照片`} className="size-14 rounded-2xl object-cover" /><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="text-sm font-medium">{pet.name}</p><span className={`rounded-full px-2 py-0.5 text-[11px] ${identityChip[pet.color]}`}>{pet.type}</span></div><p className="mt-0.5 text-xs text-muted-foreground">{pet.breed || '尚未填写品种'}</p></div><button type="button" onClick={() => setEditing({ ...pet })} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary"><Edit3 className="size-3.5" />编辑</button></div>)}</div><button type="button" onClick={() => setEditing({ id: `new-${Date.now()}`, name: '', type: '猫', breed: '', birthday: '', sex: '母', color: 'apricot', photo: '/pets/orange.png' })} className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary"><Plus className="size-4" />添加宠物</button>{message && <p className="mt-3 text-sm text-safe-foreground" role="status">{message}</p>}</Card>{editing && <Modal title={editing.name ? '编辑宠物' : '添加宠物'} onClose={() => setEditing(null)}><div className="grid gap-3"><Field label="名字" value={editing.name} onChange={(value) => setEditing({ ...editing, name: value })} /><div className="grid grid-cols-2 gap-3"><label className="text-sm text-muted-foreground">类型<select value={editing.type} onChange={(event) => setEditing({ ...editing, type: event.target.value as '猫' | '狗' })} className="mt-1 w-full rounded-xl bg-background p-3 text-foreground"><option value="猫">猫</option><option value="狗">狗</option></select></label><label className="text-sm text-muted-foreground">性别<select value={editing.sex} onChange={(event) => setEditing({ ...editing, sex: event.target.value as '公' | '母' })} className="mt-1 w-full rounded-xl bg-background p-3 text-foreground"><option value="母">母</option><option value="公">公</option></select></label></div><Field label="品种" value={editing.breed} onChange={(value) => setEditing({ ...editing, breed: value })} /><Field label="生日" type="date" value={editing.birthday} onChange={(value) => setEditing({ ...editing, birthday: value })} /><div><p className="text-sm text-muted-foreground">身份颜色</p><div className="mt-2 flex gap-2">{(['lavender', 'sage', 'apricot', 'slate-blue'] as IdentityColor[]).map((color) => <button type="button" aria-label={color} key={color} onClick={() => setEditing({ ...editing, color })} className={`size-8 rounded-full ${identityDot[color]} ${editing.color === color ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card' : ''}`} />)}</div></div><button type="button" disabled={saving} onClick={save} className="mt-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-50">{saving ? '保存中…' : '保存'}</button>{editing.id && !editing.id.startsWith('new-') && <button type="button" disabled={saving} onClick={archive} className="rounded-full bg-expired-soft py-3 text-sm text-expired disabled:opacity-50">归档宠物</button>}</div></Modal>}</>
}

function InventoryGroup({ initialSections }: { initialSections: SectionConfig[] }) {
  const [sections, setSections] = useState(initialSections)
  const [editing, setEditing] = useState<{ id?: string; section: '猫' | '狗'; name: string; unit: string; expiryRequired: boolean } | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  async function save() { if (!editing) return; setSaving(true); try { const result = await saveCategorySettings({ ...editing, expiryRequired: editing.expiryRequired }); const id = result.id ?? editing.id; const category: CategoryConfig = { id: id ?? `new-${Date.now()}`, name: editing.name, icon: '✨', unit: editing.unit, expiryRequired: editing.expiryRequired, supportsProgress: false }; setSections((current) => current.map((section) => ({ ...section, categories: section.categories.filter((item) => item.id !== category.id) })).map((section) => section.name === editing.section ? { ...section, categories: [...section.categories, category] } : section)); setEditing(null); setMessage('分类已保存') } catch (cause) { setMessage(cause instanceof Error ? cause.message : '保存失败') } finally { setSaving(false) } }
  async function archive() { if (!editing?.id || editing.id.startsWith('new-')) return; setSaving(true); try { await archiveCategory(editing.id); setSections((current) => current.map((section) => ({ ...section, categories: section.categories.filter((item) => item.id !== editing.id) }))); setEditing(null); setMessage('分类已归档') } catch (cause) { setMessage(cause instanceof Error ? cause.message : '归档失败') } finally { setSaving(false) } }
  return <><div className="flex flex-col gap-4">{sections.map((section) => <Card key={section.key} title={`${section.name} 分区`} hint="分类决定库存卡片如何分组展示"><div className="flex flex-col divide-y divide-border/60">{section.categories.map((category) => <button key={category.id} type="button" onClick={() => setEditing({ id: category.id, section: section.name, name: category.name, unit: category.unit, expiryRequired: category.expiryRequired })} className="flex items-center justify-between py-3 text-left"><span className="flex items-center gap-2.5 text-sm"><span className="flex size-8 items-center justify-center rounded-xl bg-background text-base">{category.icon}</span>{category.name}</span><span className="flex items-center gap-1.5 text-xs text-muted-foreground">默认单位 · {category.unit}<ChevronRight className="size-4" /></span></button>)}</div><button type="button" onClick={() => setEditing({ id: `new-${Date.now()}`, section: section.name, name: '', unit: '件', expiryRequired: true })} className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary"><Plus className="size-4" />添加分类</button></Card>)}</div>{message && <p className="mt-3 text-sm text-safe-foreground" role="status">{message}</p>}{editing && <Modal title={editing.name ? '编辑分类' : '添加分类'} onClose={() => setEditing(null)}><div className="grid gap-3"><label className="text-sm text-muted-foreground">分区<select value={editing.section} onChange={(event) => setEditing({ ...editing, section: event.target.value as '猫' | '狗' })} className="mt-1 w-full rounded-xl bg-background p-3 text-foreground"><option value="猫">猫</option><option value="狗">狗</option></select></label><Field label="分类名称" value={editing.name} onChange={(value) => setEditing({ ...editing, name: value })} /><Field label="默认单位" value={editing.unit} onChange={(value) => setEditing({ ...editing, unit: value })} /><label className="flex items-center justify-between rounded-2xl bg-background px-4 py-3 text-sm"><span>需要记录效期</span><input type="checkbox" checked={editing.expiryRequired} onChange={(event) => setEditing({ ...editing, expiryRequired: event.target.checked })} /></label><button type="button" disabled={saving} onClick={save} className="rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-50">{saving ? '保存中…' : '保存分类'}</button>{editing.id && !editing.id.startsWith('new-') && <button type="button" disabled={saving} onClick={archive} className="rounded-full bg-expired-soft py-3 text-sm text-expired disabled:opacity-50">归档分类</button>}</div></Modal>}</>
}

function CatalogGroup({ initialCatalog, sections }: { initialCatalog: CatalogProduct[]; sections: SectionConfig[] }) {
  const [products, setProducts] = useState(initialCatalog)
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<CatalogProduct | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const categories = sections.flatMap((section) => section.categories.map((category) => ({ ...category, section: section.name })))
  const filtered = products.filter((product) => `${product.name}${product.brand}${product.barcode ?? ''}`.toLowerCase().includes(query.toLowerCase()))
  async function save() {
    if (!editing) return
    setSaving(true)
    try {
      await updateProductSettings({ id: editing.id, name: editing.name, brand: editing.brand, specification: editing.specification, barcode: editing.barcode, categoryId: editing.categoryId })
      let image = editing.image
      if (file) { const formData = new FormData(); formData.set('productId', editing.id); formData.set('file', file); const result = await uploadProductImage(formData); image = result.url }
      const updated = { ...editing, image }
      setProducts((current) => current.map((product) => product.id === editing.id ? updated : product))
      setEditing(null); setFile(null); setMessage('商品信息已保存')
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : '保存失败') } finally { setSaving(false) }
  }
  async function archive() { if (!editing) return; setSaving(true); try { await archiveProduct(editing.id); setProducts((current) => current.map((product) => product.id === editing.id ? { ...product, archived: true } : product)); setEditing(null); setMessage('商品已归档') } catch (cause) { setMessage(cause instanceof Error ? cause.message : '归档失败') } finally { setSaving(false) } }
  return <><Card title="商品库" hint="维护所有历史商品档案、条码、品牌和图片"><label className="flex h-11 items-center gap-2 rounded-2xl bg-background px-3.5 ring-1 ring-border/70"><Search className="size-4 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索商品、品牌或条码" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label><div className="mt-3 flex flex-col divide-y divide-border/60">{filtered.map((product) => <button key={product.id} type="button" onClick={() => { setEditing({ ...product }); setFile(null) }} className="flex items-center gap-3 py-3 text-left"><img src={product.image || '/products/treats.png'} alt={`${product.name}包装`} className="size-12 rounded-xl bg-secondary object-cover" /><div className="min-w-0 flex-1"><p className="text-sm">{product.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{product.brand || '未记录品牌'} · {product.specification || '未记录规格'} · {product.barcode || '无条码'}</p></div><span className="text-xs text-muted-foreground">{product.stock === 0 ? '零库存' : `${product.stock} 件`}</span></button>)}{filtered.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">没有找到匹配商品</p>}</div>{message && <p className="mt-3 text-sm text-safe-foreground" role="status">{message}</p>}</Card>{editing && <Modal title="编辑商品信息" onClose={() => setEditing(null)}><div className="grid gap-3"><div className="flex items-center gap-3"><img src={editing.image || '/products/treats.png'} alt="商品图片" className="size-16 rounded-2xl bg-secondary object-cover" /><label className="rounded-full bg-secondary px-3 py-2 text-xs font-medium">更换图片<input type="file" accept="image/*" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label></div><Field label="商品名称" value={editing.name} onChange={(value) => setEditing({ ...editing, name: value })} /><Field label="品牌" value={editing.brand} onChange={(value) => setEditing({ ...editing, brand: value })} placeholder="可选" /><Field label="规格" value={editing.specification} onChange={(value) => setEditing({ ...editing, specification: value })} placeholder="例如 1kg" /><Field label="条码" value={editing.barcode ?? ''} onChange={(value) => setEditing({ ...editing, barcode: value })} placeholder="EAN / UPC" /><label className="text-sm text-muted-foreground">分类<select value={editing.categoryId ?? ''} onChange={(event) => setEditing({ ...editing, categoryId: event.target.value })} className="mt-1 w-full rounded-xl bg-background p-3 text-foreground"><option value="">保持原分类</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.section} · {category.name}</option>)}</select></label><button type="button" disabled={saving} onClick={save} className="rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-50">{saving ? '保存中…' : '保存商品'}</button><button type="button" disabled={saving} onClick={archive} className="rounded-full bg-expired-soft py-3 text-sm text-expired disabled:opacity-50"><Archive className="mr-1 inline size-4" />归档商品</button></div></Modal>}</>
}
