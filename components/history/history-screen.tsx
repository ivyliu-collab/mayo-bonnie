'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react'
import { reverseInventoryEvent, updateInventoryEventNote } from '@/app/actions/history'
import type { HistoryRecord } from '@/lib/data/household-data'

const tabs = ['全部', '入库', '消耗', '开袋', '过期', '调整']

export function HistoryScreen({ records, initialTab, initialSection, initialProduct }: { records: HistoryRecord[]; initialTab?: string; initialSection?: string; initialProduct?: string }) {
  const router = useRouter()
  const [items, setItems] = useState(records)
  const [tab, setTab] = useState(initialTab && tabs.includes(initialTab) ? initialTab : '全部')
  const [query, setQuery] = useState(initialProduct ?? '')
  const [pet, setPet] = useState(initialSection === '猫' || initialSection === '狗' ? initialSection : '全部')
  const [selected, setSelected] = useState<HistoryRecord | null>(null)
  const [editing, setEditing] = useState(false)
  const [note, setNote] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const visible = useMemo(() => items.filter((record) => (tab === '全部' || record.type === tab) && (pet === '全部' || record.section === pet) && `${record.product}${record.note}`.toLowerCase().includes(query.toLowerCase())), [items, tab, pet, query])

  function selectRecord(record: HistoryRecord) {
    setSelected(record)
    setEditing(false)
    setNote(record.note)
    setMessage('')
  }

  async function saveNote() {
    if (!selected) return
    setSaving(true)
    try {
      await updateInventoryEventNote(selected.id, note)
      const updated = { ...selected, note: note.trim() || selected.type }
      setItems((current) => current.map((item) => item.id === selected.id ? updated : item))
      setSelected(updated)
      setEditing(false)
      setMessage('备注已保存')
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  async function reverse() {
    if (!selected || !selected.canReverse) return
    setSaving(true)
    try {
      await reverseInventoryEvent(selected.id)
      const updated = { ...selected, canReverse: false, reverted: true }
      setItems((current) => current.map((item) => item.id === selected.id ? updated : item))
      setSelected(updated)
      setMessage('操作已撤销，库存已回滚')
      router.refresh()
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : '撤销失败')
    } finally {
      setSaving(false)
    }
  }

  return <main className="min-h-dvh bg-background pb-10"><header className="mx-auto flex max-w-3xl items-center justify-between px-5 pb-5 pt-7"><div className="flex items-center gap-3"><Link href="/" aria-label="返回 Home" className="rounded-full p-2 hover:bg-secondary"><ArrowLeft className="size-5" /></Link><div><p className="text-xs text-muted-foreground">Activity</p><h1 className="text-2xl font-semibold tracking-tight">历史记录</h1></div></div><button type="button" className="flex items-center gap-1 rounded-full bg-card px-3 py-2 text-sm ring-1 ring-border/60"><span>全部时间</span><ChevronDown className="size-4" /></button></header><section className="mx-auto max-w-3xl px-5"><div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar">{tabs.map((item) => <button key={item} type="button" onClick={() => setTab(item)} className={`whitespace-nowrap rounded-full px-3.5 py-2 text-sm ${tab === item ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground ring-1 ring-border/60'}`}>{item}</button>)}</div><div className="flex gap-2"><label className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-card px-3.5 py-3 ring-1 ring-border/60"><Search className="size-4 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索商品或备注" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" /></label><button type="button" onClick={() => setPet(pet === '全部' ? '猫' : pet === '猫' ? '狗' : '全部')} className="flex items-center gap-1 rounded-2xl bg-card px-3 text-sm text-muted-foreground ring-1 ring-border/60"><SlidersHorizontal className="size-4" />{pet}</button></div><div className="mt-7 flex flex-col gap-7">{visible.map((record, index) => <section key={record.id}><p className="mb-2 px-1 text-xs font-medium text-muted-foreground">{index === 0 || visible[index - 1].date !== record.date ? record.date : ''}</p><button type="button" onClick={() => selectRecord(record)} className="flex w-full items-center gap-3 rounded-2xl bg-card p-3 text-left ring-1 ring-border/60 transition hover:-translate-y-0.5"><div className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-xs font-semibold ${record.section === '猫' ? 'bg-apricot/30' : 'bg-slate-blue/25'}`}>{record.pet}</div><div className="min-w-0 flex-1"><div className="flex items-baseline justify-between gap-3"><p className="truncate text-sm font-medium">{record.product}</p><span className="shrink-0 font-mono text-xs text-muted-foreground">{record.time}</span></div><p className="mt-1 truncate text-xs text-muted-foreground">{record.pet} · {record.note}{record.edited ? ' · 已修改' : record.reverted ? ' · 已撤销' : ''}</p></div><span className="font-mono text-sm font-semibold">{record.detail}</span></button></section>)}</div>{visible.length === 0 && <p className="py-16 text-center text-sm text-muted-foreground">没有找到匹配记录</p>}</section>{selected && <div className="fixed inset-0 z-40 flex items-end justify-center bg-foreground/15 p-4" onClick={() => setSelected(null)}><div className="w-full max-w-lg rounded-3xl bg-card p-5 shadow-xl" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between"><div><p className="text-xs text-muted-foreground">{selected.date} · {selected.time}</p><h2 className="mt-1 text-lg font-semibold">{selected.product}</h2></div><button type="button" onClick={() => setSelected(null)} aria-label="关闭"><X className="size-5 text-muted-foreground" /></button></div>{editing ? <textarea value={note} onChange={(event) => setNote(event.target.value)} className="mt-4 min-h-24 w-full rounded-2xl bg-background px-4 py-3 text-sm ring-1 ring-border/70" maxLength={200} /> : <p className="mt-4 rounded-2xl bg-background px-4 py-3 text-sm text-muted-foreground">{selected.pet} · {selected.type} · {selected.detail}<br />备注：{selected.note}</p>}{message && <p className="mt-3 text-sm text-safe-foreground" role="status">{message}</p>}<div className="mt-4 flex gap-2">{editing ? <button type="button" disabled={saving} onClick={saveNote} className="flex-1 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-50">{saving ? '保存中…' : '保存备注'}</button> : selected.canEdit && <button type="button" onClick={() => setEditing(true)} className="flex-1 rounded-full bg-secondary py-3 text-sm font-medium">编辑备注</button>}{selected.canReverse && <button type="button" disabled={saving} onClick={reverse} className="flex-1 rounded-full bg-background py-3 text-sm font-medium ring-1 ring-border disabled:opacity-50">{saving ? '处理中…' : '撤销操作'}</button>}</div></div></div>}</main>
}
