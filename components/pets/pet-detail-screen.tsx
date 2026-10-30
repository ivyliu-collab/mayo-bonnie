'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowLeft, Bath, Edit3, LineChart, Plus, Scissors, X } from 'lucide-react'
import { savePetHealthRecord } from '@/app/actions/pet-health'
import type { PetHealthRecord } from '@/lib/data/household-data'
import { pets as mockPets, type Pet } from '@/lib/mock-data'

type Sheet = 'weight' | 'deworming' | 'grooming'

function formatDate(value: string) {
  return value.replaceAll('-', '/')
}

export function PetDetailScreen({
  id,
  initialPet,
  initialRecords = [],
}: {
  id: string
  initialPet?: Pet
  initialRecords?: PetHealthRecord[]
}) {
  const pet = initialPet ?? mockPets.find((item) => item.id === id) ?? mockPets[0]
  const [records, setRecords] = useState(initialRecords)
  const [sheet, setSheet] = useState<Sheet | null>(null)
  const [saved, setSaved] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), value: '', subtype: '内驱', brand: '', note: '' })

  const weights = useMemo(() => records.filter((record) => record.type === 'weight'), [records])
  const deworming = useMemo(() => records.filter((record) => record.type === 'deworming'), [records])
  const grooming = useMemo(() => records.filter((record) => record.type === 'grooming'), [records])
  const latestWeight = weights[0]
  const latestInternal = deworming.find((record) => record.subtype === '内驱')
  const latestExternal = deworming.find((record) => record.subtype === '外驱')
  const latestBath = grooming.find((record) => record.subtype === '洗澡')
  const latestTrim = grooming.find((record) => record.subtype === '美容')
  const isDog = pet.type === '狗'

  function openSheet(next: Sheet) {
    setSaved('')
    setForm({ date: new Date().toISOString().slice(0, 10), value: next === 'weight' && latestWeight?.value ? String(latestWeight.value) : '', subtype: next === 'grooming' ? '洗澡' : '内驱', brand: '', note: '' })
    setSheet(next)
  }

  async function save() {
    if (!sheet) return
    setSaving(true)
    setSaved('')
    try {
      const type = sheet
      const result = await savePetHealthRecord({ petId: pet.id, type, date: form.date, subtype: form.subtype, value: type === 'weight' ? Number(form.value) : undefined, unit: type === 'weight' ? 'kg' : undefined, brand: form.brand, note: form.note })
      setRecords((current) => [{ id: result.id, petId: pet.id, type, subtype: form.subtype, date: form.date, value: type === 'weight' ? Number(form.value) : null, unit: type === 'weight' ? 'kg' : '', brand: form.brand, note: form.note }, ...current])
      setSheet(null)
      setSaved('已保存记录')
    } catch (cause) {
      setSaved(cause instanceof Error ? cause.message : '保存失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  return <main className="min-h-dvh bg-background pb-10">
    <div className="mx-auto max-w-3xl px-4 pb-12 pt-5 md:px-8 md:pt-8">
      <header className="mb-6 flex items-center justify-between"><Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="size-4" />返回</Link><button type="button" className="flex items-center gap-1.5 text-sm text-muted-foreground"><Edit3 className="size-4" />编辑</button></header>
      <section className="overflow-hidden rounded-[28px] bg-card shadow-[0_20px_45px_-30px_rgba(80,60,40,.45)]"><div className="relative h-64 md:h-80"><img src={pet.photo} alt={`${pet.name}的照片`} className="h-full w-full object-cover" /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/55 to-transparent p-6 pt-20 text-card"><p className="text-xs tracking-wide text-card/75">{pet.breed} · {pet.type}</p><h1 className="mt-1 text-3xl font-medium">{pet.name}</h1><p className="mt-1 text-sm text-card/80">{pet.age}</p></div></div></section>
      <section className="mt-6 rounded-[24px] bg-card p-5 ring-1 ring-border/60"><div className="flex items-start justify-between"><div><p className="text-xs text-muted-foreground">Weight</p><p className="mt-2 font-mono text-4xl font-semibold">{latestWeight?.value ?? '—'} <span className="text-base font-sans font-normal text-muted-foreground">{latestWeight ? 'kg' : ''}</span></p><p className="mt-1 text-xs text-muted-foreground">{latestWeight ? `最近记录于 ${formatDate(latestWeight.date)}` : '还没有体重记录'}</p></div><LineChart className="size-5 text-sage-foreground" /></div><div className="mt-5 h-12 overflow-hidden rounded-2xl bg-sage/10 px-2"><svg viewBox="0 0 300 48" className="h-full w-full" preserveAspectRatio="none"><path d="M0 30 C35 25 45 34 75 23 S120 28 150 17 S195 28 225 13 S270 20 300 8" fill="none" stroke="currentColor" strokeWidth="2" className="text-sage-foreground" /></svg></div><div className="mt-5 divide-y divide-border">{weights.slice(0, 5).map((record) => <div key={record.id} className="flex justify-between py-2.5 text-sm"><span className="text-muted-foreground">{formatDate(record.date)}</span><span className="font-mono text-foreground">{record.value} kg</span></div>)}{weights.length === 0 && <p className="py-3 text-sm text-muted-foreground">暂无记录</p>}</div><div className="mt-4 flex gap-3"><button type="button" onClick={() => openSheet('weight')} className="flex items-center gap-1.5 text-sm font-medium text-sage-foreground"><Plus className="size-4" />记录体重</button></div></section>
      <section className="mt-5 rounded-[24px] bg-card p-5 ring-1 ring-border/60"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Deworming</p><h2 className="mt-1 text-lg font-medium">驱虫记录</h2></div><button type="button" onClick={() => openSheet('deworming')} className="flex items-center gap-1 text-sm text-muted-foreground"><Plus className="size-4" />记录</button></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{([{ label: '内驱', record: latestInternal }, { label: '外驱', record: latestExternal }] as const).map(({ label, record }) => <div key={label} className="rounded-2xl bg-background/60 p-4"><div className="flex justify-between"><span className="font-medium">{label}</span><span className={record ? 'text-safe' : 'text-muted-foreground'}>{record ? '已记录' : '暂无记录'}</span></div><p className="mt-3 text-xs text-muted-foreground">{record ? `最近：${formatDate(record.date)}${record.brand ? ` · ${record.brand}` : ''}` : '还没有这类记录'}</p><p className="mt-1 text-xs text-muted-foreground">{record?.note || '可以记录品牌和备注'}</p></div>)}</div><div className="mt-4 text-sm text-muted-foreground">共 {deworming.length} 条驱虫记录</div></section>
      {isDog && <section className="mt-5 rounded-[24px] bg-card p-5 ring-1 ring-border/60"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Dog care</p><h2 className="mt-1 text-lg font-medium">洗澡 / 美容</h2></div><button type="button" onClick={() => openSheet('grooming')} className="flex items-center gap-1 text-sm text-muted-foreground"><Plus className="size-4" />记录</button></div><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-slate-blue/10 p-4"><Bath className="size-4 text-slate-blue-foreground" /><p className="mt-3 text-sm">洗澡 · {latestBath ? formatDate(latestBath.date) : '暂无记录'}</p></div><div className="rounded-2xl bg-apricot/10 p-4"><Scissors className="size-4 text-apricot-foreground" /><p className="mt-3 text-sm">美容 · {latestTrim ? formatDate(latestTrim.date) : '暂无记录'}</p></div></div><p className="mt-4 text-sm text-muted-foreground">共 {grooming.length} 条护理记录</p></section>}
    </div>
    {sheet && <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 p-3 md:items-center"><div className="w-full max-w-md rounded-[28px] bg-card p-5 shadow-2xl"><div className="flex justify-between"><h2 className="text-lg font-medium">{sheet === 'weight' ? '记录体重' : sheet === 'deworming' ? '记录驱虫' : '记录护理'}</h2><button type="button" onClick={() => setSheet(null)} aria-label="关闭"><X className="size-5" /></button></div><div className="mt-5 grid gap-3"><label className="text-sm text-muted-foreground">日期<input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} className="mt-1 w-full rounded-xl bg-background p-3 text-foreground" /></label>{sheet === 'weight' && <label className="text-sm text-muted-foreground">体重 kg<input type="number" min="0.01" step="0.1" value={form.value} onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))} placeholder="例如 5.2" className="mt-1 w-full rounded-xl bg-background p-3 text-foreground" /></label>}{sheet === 'deworming' && <><label className="text-sm text-muted-foreground">类型<select value={form.subtype} onChange={(event) => setForm((current) => ({ ...current, subtype: event.target.value }))} className="mt-1 w-full rounded-xl bg-background p-3 text-foreground"><option>内驱</option><option>外驱</option></select></label><label className="text-sm text-muted-foreground">品牌<input value={form.brand} onChange={(event) => setForm((current) => ({ ...current, brand: event.target.value }))} placeholder="可选" className="mt-1 w-full rounded-xl bg-background p-3 text-foreground" /></label></>}{sheet === 'grooming' && <label className="text-sm text-muted-foreground">项目<select value={form.subtype} onChange={(event) => setForm((current) => ({ ...current, subtype: event.target.value }))} className="mt-1 w-full rounded-xl bg-background p-3 text-foreground"><option>洗澡</option><option>美容</option></select></label>}<label className="text-sm text-muted-foreground">备注<textarea value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} className="mt-1 min-h-20 w-full rounded-xl bg-background p-3 text-foreground" /></label><button type="button" disabled={saving} onClick={save} className="mt-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-50">{saving ? '保存中…' : '保存记录'}</button></div></div></div>}
    {saved && <button type="button" onClick={() => setSaved('')} className={`fixed bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-full px-4 py-2 text-sm ${saved.includes('失败') || saved.includes('请输入') ? 'bg-expired text-background' : 'bg-foreground text-background'}`}>{saved}</button>}
  </main>
}
