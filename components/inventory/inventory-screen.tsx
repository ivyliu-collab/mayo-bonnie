'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDownUp, Boxes, Check, ChevronRight, Clock3, Download, Filter, History, Home, MoreHorizontal, PackagePlus, Search } from 'lucide-react'
import { inventoryProducts, type InventoryProduct, type InventorySection } from '@/lib/inventory-data'

const accents = {
  lavender: 'bg-lavender/15 text-lavender-foreground',
  sage: 'bg-sage/15 text-sage-foreground',
  apricot: 'bg-apricot/20 text-apricot-foreground',
  'slate-blue': 'bg-slate-blue/15 text-slate-blue-foreground',
}

const sectionLabels: InventorySection[] = ['全部', '猫', '狗']

export function InventoryScreen({ initialProducts = inventoryProducts }: { initialProducts?: InventoryProduct[] }) {
  const inventory = initialProducts
  const [section, setSection] = useState<InventorySection>('全部')
  const [category, setCategory] = useState('全部')
  const [query, setQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  const categories = useMemo(() => {
    const scoped = section === '全部' ? inventory : inventory.filter((product) => product.section === section)
    return ['全部', ...Array.from(new Set(scoped.map((product) => product.category)))]
  }, [inventory, section])

  const products = useMemo(() => inventory.filter((product) => {
    const matchesSection = section === '全部' || product.section === section
    const matchesCategory = category === '全部' || product.category === category
    const matchesQuery = `${product.name}${product.category}`.toLowerCase().includes(query.toLowerCase())
    return matchesSection && matchesCategory && matchesQuery
  }), [inventory, section, category, query])

  function selectSection(next: InventorySection) {
    setSection(next)
    setCategory('全部')
  }

  return (
    <div className="min-h-dvh bg-background pb-24 md:pb-8">
      <header className="border-b border-border/45 bg-background/75 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 md:px-8 md:py-6">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground"><Boxes className="size-4" /><span className="text-xs font-medium uppercase tracking-[0.16em]">Inventory</span></div>
            <h1 className="mt-2 text-2xl font-medium tracking-tight text-foreground md:text-3xl">库存清单</h1>
            <p className="mt-1 text-sm text-muted-foreground">家里的每一份照料，都有迹可循</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/history" className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary sm:flex"><History className="size-4" />历史记录</Link>
            <button type="button" className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary sm:flex"><Download className="size-4" />导出</button>
            <button type="button" aria-label="更多操作" className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary sm:hidden"><MoreHorizontal className="size-5" /></button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-5 md:px-8 md:pt-7">
        <div className="flex items-center gap-2 border-b border-border/50 pb-2">
          {sectionLabels.map((item) => <button key={item} type="button" onClick={() => selectSection(item)} className={`relative px-2 py-2 text-sm transition-colors ${section === item ? 'font-medium text-foreground after:absolute after:inset-x-2 after:-bottom-[9px] after:h-0.5 after:rounded-full after:bg-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{item}</button>)}
        </div>

        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs transition-colors ${category === item ? 'bg-foreground text-background' : 'bg-card text-muted-foreground ring-1 ring-border/70 hover:bg-secondary'}`}>{item}</button>)}
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex h-11 flex-1 items-center gap-2 rounded-2xl bg-card px-3.5 ring-1 ring-border/70 sm:max-w-md"><Search className="size-4 text-muted-foreground" /><span className="sr-only">搜索库存</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索商品名称或类别" className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70" /></label>
          <div className="relative flex gap-2">
            <button type="button" onClick={() => setFilterOpen((open) => !open)} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-card px-4 py-3 text-sm text-foreground ring-1 ring-border/70 sm:flex-none"><Filter className="size-4 text-muted-foreground" />筛选</button>
            <button type="button" onClick={() => setSortOpen((open) => !open)} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-card px-4 py-3 text-sm text-foreground ring-1 ring-border/70 sm:flex-none"><ArrowDownUp className="size-4 text-muted-foreground" />排序</button>
            {(filterOpen || sortOpen) && <div className="absolute right-0 top-14 z-10 rounded-2xl bg-card p-3 text-sm text-muted-foreground shadow-[0_16px_34px_-18px_rgba(80,60,40,0.5)] ring-1 ring-border"><p>{filterOpen ? '显示：全部库存' : '排序：最近更新'}</p></div>}
          </div>
        </div>

        <div className="mt-7 flex items-baseline justify-between"><div><h2 className="text-base font-medium text-foreground">{section === '全部' ? '全部库存' : `${section}的库存`}</h2><p className="mt-1 text-xs text-muted-foreground">{products.length} 个商品 · 按宠物家庭整理</p></div><button type="button" className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">管理分类<ChevronRight className="size-3.5" /></button></div>

        <div className="mt-4 flex flex-col gap-3">
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
          {products.length === 0 && <div className="rounded-3xl bg-card px-5 py-12 text-center text-sm text-muted-foreground ring-1 ring-border/60">没有找到匹配的库存</div>}
        </div>
      </main>
      <div className="fixed bottom-5 right-5 z-20 md:bottom-7 md:right-8"><Link href="/stock-in" className="flex items-center gap-2 rounded-full bg-apricot/90 px-4 py-3 text-sm font-medium text-apricot-foreground shadow-[0_12px_25px_-14px_rgba(80,60,40,0.65)]"><PackagePlus className="size-4" />添加库存</Link></div>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-card/90 px-6 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2.5 backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around">
          <Link href="/" className="flex w-16 flex-col items-center gap-1 py-1 text-muted-foreground"><Home className="size-5.5" strokeWidth={1.75} /><span className="text-[11px] font-medium">Home</span></Link>
          <Link href="/stock-in" aria-label="添加库存" className="-mt-5 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"><PackagePlus className="size-5" /></Link>
          <Link href="/inventory" className="flex w-16 flex-col items-center gap-1 py-1 text-primary"><Boxes className="size-5.5" strokeWidth={1.75} /><span className="text-[11px] font-medium">Inventory</span></Link>
        </div>
      </nav>
    </div>
  )
}

function ProductCard({ product }: { product: InventoryProduct }) {
  const router = useRouter()
  const expiryTone = product.expiryComposition?.urgent ? 'text-expired' : product.expiryComposition?.attention ? 'text-attention' : 'text-muted-foreground'
  const actionLabel = product.progress ? (product.progress < 40 ? '用完' : '开袋') : '−1'
  return <article role="link" tabIndex={0} onClick={() => router.push(`/inventory/product/${product.id}`)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); router.push(`/inventory/product/${product.id}`) } }} className="group flex cursor-pointer gap-4 rounded-3xl bg-card p-3.5 ring-1 ring-border/60 transition-transform hover:-translate-y-0.5 md:items-center md:p-4">
    <div className={`flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl ${accents[product.accent]} sm:size-28 md:size-36`}><img src={product.image} alt={`${product.name} 包装`} className="size-full object-cover mix-blend-multiply" /></div>
    <div className="min-w-0 flex-1 py-0.5">
      <div className="flex items-start justify-between gap-2"><div><p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{product.section} · {product.category}</p><h3 className="mt-1 text-sm font-medium text-foreground md:text-base">{product.name}</h3></div><button type="button" aria-label={`${product.name} 更多操作`} className="text-muted-foreground/60 hover:text-foreground"><MoreHorizontal className="size-4" /></button></div>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3"><div><span className="font-mono text-2xl font-semibold leading-none text-foreground">{product.quantity}</span><span className="ml-1 text-xs text-muted-foreground">{product.unit}</span></div><span className={`rounded-full px-2 py-1 text-[11px] font-medium ${accents[product.accent]}`}>{product.statusLabel}</span></div>
      {product.progress ? <div className="mt-3 max-w-md"><div className="mb-1 flex justify-between text-[11px] text-muted-foreground"><span>已开封余量</span><span>{product.progress}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${product.progress}%` }} /></div></div> : null}
      {product.expiryComposition ? <div className="mt-3 max-w-md"><div className="flex items-center justify-between text-[11px]"><span className={`flex items-center gap-1 ${expiryTone}`}><Clock3 className="size-3.5" />最近效期 {product.expiry}</span><span className="text-muted-foreground">效期分布</span></div><div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-secondary"><span className="bg-expired" style={{ width: `${product.expiryComposition.urgent}%` }} /><span className="bg-attention" style={{ width: `${product.expiryComposition.attention}%` }} /><span className="bg-safe" style={{ width: `${product.expiryComposition.safe}%` }} /></div><div className="mt-1 flex gap-3 text-[10px] text-muted-foreground"><span>急 {product.expiryComposition.urgentQty}</span><span>关注 {product.expiryComposition.attentionQty}</span><span>安全 {product.expiryComposition.safeQty}</span></div></div> : <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"><Check className="size-3.5" />无需记录效期</p>}
      <div className="mt-3 flex gap-2"><button type="button" className="rounded-full bg-background px-3 py-1.5 text-xs font-medium text-foreground ring-1 ring-border/70 transition-colors hover:bg-secondary">{actionLabel}</button><Link href="/stock-in" className="rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-colors hover:opacity-90">+入库</Link><button type="button" className="rounded-full px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary">More</button></div>
    </div>
  </article>
}
