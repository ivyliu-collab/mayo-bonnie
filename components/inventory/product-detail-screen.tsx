'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, ChevronRight, Clock3, MoreHorizontal, PackagePlus, Plus, X } from 'lucide-react'
import { inventoryProducts, type InventoryProductDetail } from '@/lib/inventory-data'
import { consumeProduct } from '@/app/actions/inventory-consume'

const details: Record<string, InventoryProductDetail> = {
  'wet-food': { ...inventoryProducts[1], brand: 'Ziwi', specification: '85g × 24罐', history: ['2026/09/16 · 消耗 −1', '2026/09/12 · 入库 +12', '2026/09/05 · 调整 20 → 18'], expiryRows: [{ date: '2026/10/03', quantity: 5, tone: 'urgent' }, { date: '2026/12/18', quantity: 8, tone: 'attention' }, { date: '2027/06/20', quantity: 17, tone: 'safe' }] },
  'cat-food': { ...inventoryProducts[0], name: 'Ziwi Peak Air-Dried', brand: 'Ziwi Peak', specification: '1kg · 风干猫粮', quantity: 3, unit: '包', statusLabel: '3包 · 1已开', openedDate: '2026/09/01', expectedDays: 30, remaining: 58, history: ['2026/09/15 · 开袋', '2026/09/01 · 入库 +2'], expiryRows: [{ date: '2026/12/18', quantity: 1, tone: 'attention' }, { date: '2027/04/16', quantity: 2, tone: 'safe' }] },
}

const toneClasses = { urgent: 'bg-expired/12 text-expired', attention: 'bg-attention/15 text-attention-foreground', safe: 'bg-safe/15 text-safe-foreground' }

export function ProductDetailScreen({ id, initialProduct }: { id: string; initialProduct?: InventoryProductDetail }) {
  const product = initialProduct ?? details[id] ?? details['wet-food']
  const [sheetOpen, setSheetOpen] = useState(false)
  const [currentQuantity, setCurrentQuantity] = useState(product.quantity)
  const [expiryRows, setExpiryRows] = useState(product.expiryRows)
  const [history, setHistory] = useState(product.history)
  const [openedActive, setOpenedActive] = useState(Boolean(product.progress))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const isProgress = openedActive
  const consumeOpenedItem = async () => {
    if (currentQuantity <= 0) return
    setSaving(true)
    setMessage('')
    try {
      await consumeProduct(product.id)
      setCurrentQuantity((quantity) => quantity - 1)
      setExpiryRows((rows) => rows.map((row) => row.date === '2026/12/18' ? { ...row, quantity: Math.max(0, row.quantity - 1) } : row))
      setHistory((items) => ['刚刚 · 消耗 −1', ...items])
      setOpenedActive(false)
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : '消耗失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  return <div className="min-h-dvh bg-background pb-10">
    <header className="border-b border-border/45 bg-background/75 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 md:px-8 md:py-5">
        <Link href="/inventory" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />库存清单</Link>
        <button type="button" aria-label="更多操作" onClick={() => setSheetOpen(true)} className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"><MoreHorizontal className="size-5" /></button>
      </div>
    </header>
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-5 md:px-8 md:pt-8">
      <section className="grid gap-5 md:grid-cols-[220px_1fr] md:items-center md:gap-8">
        <div className={`flex aspect-square items-center justify-center overflow-hidden rounded-[28px] ${product.accent === 'lavender' ? 'bg-lavender/15' : product.accent === 'sage' ? 'bg-sage/15' : 'bg-slate-blue/15'}`}><img src={product.image} alt={`${product.name} 包装`} className="size-full object-cover mix-blend-multiply" /></div>
        <div><p className="text-xs text-muted-foreground">{product.section} · {product.category}</p><h1 className="mt-2 text-2xl font-medium tracking-tight text-foreground md:text-3xl">{product.name}</h1><p className="mt-2 text-sm text-muted-foreground">{product.brand} · {product.specification}</p><div className="mt-6 flex items-end gap-2"><span className="font-mono text-4xl font-semibold leading-none text-foreground">{currentQuantity}</span><span className="pb-1 text-sm text-muted-foreground">{product.unit} · 当前库存</span></div><p className="mt-2 text-sm font-medium text-foreground">{currentQuantity}{product.unit} · {openedActive ? '1已开' : '0已开'}</p><p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground"><Clock3 className="size-4" />最近效期 {product.expiry ?? '无需记录'}</p></div>
      </section>
      <section className="mt-8 rounded-[26px] bg-card p-5 ring-1 ring-border/60 md:p-6"><div className="flex items-center justify-between"><div><h2 className="text-base font-medium">库存与效期</h2><p className="mt-1 text-xs text-muted-foreground">总库存与每个效期状态分开记录</p></div><span className="text-xs text-muted-foreground">{currentQuantity}{product.unit}</span></div><div className="mt-5 flex flex-col gap-2.5">{expiryRows.map((row) => <button type="button" key={row.date} onClick={() => setSheetOpen(true)} className="flex items-center justify-between rounded-2xl bg-background/60 px-4 py-3 text-left hover:bg-secondary"><span><span className="font-mono text-sm text-foreground">{row.date}</span><span className="ml-3 text-sm text-muted-foreground">{row.quantity}{product.unit}</span></span><span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${toneClasses[row.tone]}`}>{row.tone === 'urgent' ? 'Urgent' : row.tone === 'attention' ? 'Attention' : 'Safe'}</span></button>)}</div></section>
      {isProgress && <section className="mt-4 rounded-[26px] bg-sage/10 p-5 ring-1 ring-sage/20 md:p-6"><div className="flex items-center justify-between"><div><h2 className="text-base font-medium">已开封状态</h2><p className="mt-1 text-xs text-muted-foreground">开袋于 {product.openedDate} · 预计使用 {product.expectedDays} 天</p></div><span className="font-mono text-xl font-semibold">{product.remaining}%</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-card"><div className="h-full rounded-full bg-sage" style={{ width: `${product.remaining}%` }} /></div><p className="mt-2 text-xs text-muted-foreground">参考剩余进度 · 关联效期 {product.expiry}</p></section>}
      <section className="mt-7"><h2 className="text-base font-medium">最近记录</h2>{message ? <p className="mt-3 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">{message}</p> : null}<div className="mt-3 flex flex-col divide-y divide-border/50 rounded-[22px] bg-card px-4 ring-1 ring-border/60">{history.map((item) => <div key={item} className="flex items-center justify-between py-3 text-sm"><span className="text-muted-foreground">{item.split(' · ')[0]}</span><span className="text-foreground">{item.split(' · ')[1]}</span></div>)}<Link href={`/history?product=${encodeURIComponent(product.name)}`} className="flex items-center justify-between py-3 text-sm text-muted-foreground">查看全部记录<ChevronRight className="size-4" /></Link></div></section>
    </main>
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/60 bg-card/92 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur-md"><div className="mx-auto flex max-w-3xl gap-2"><button type="button" onClick={consumeOpenedItem} disabled={saving || currentQuantity <= 0} className="flex-1 rounded-full bg-background py-3 text-sm font-medium ring-1 ring-border/70 disabled:opacity-50">{saving ? '保存中…' : isProgress ? '用完' : '−1 消耗'}</button><Link href="/stock-in" className="flex flex-1 items-center justify-center gap-1 rounded-full bg-foreground py-3 text-sm font-medium text-background"><Plus className="size-4" />入库</Link><button type="button" onClick={() => setSheetOpen(true)} className="flex size-12 items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-border/70" aria-label="More"><MoreHorizontal className="size-5" /></button></div></div>
    {sheetOpen && <div className="fixed inset-0 z-40 flex items-end bg-foreground/15 p-3" onClick={() => setSheetOpen(false)}><div className="mx-auto w-full max-w-3xl rounded-[26px] bg-card p-5 shadow-xl" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><h2 className="font-medium">快速操作</h2><button type="button" aria-label="关闭" onClick={() => setSheetOpen(false)}><X className="size-5 text-muted-foreground" /></button></div><div className="mt-4 grid gap-2"><button type="button" className="rounded-2xl bg-background py-3 text-sm text-left px-4">调整库存</button><button type="button" className="rounded-2xl bg-background py-3 text-sm text-left px-4">编辑商品信息</button></div></div></div>}
  </div>
}
