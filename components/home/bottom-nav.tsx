'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Home, Boxes, Plus, ScanLine, PencilLine, X } from 'lucide-react'

export function BottomNav() {
  const pathname = usePathname()
  const active = pathname.startsWith('/inventory') ? 'inventory' : 'home'
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <>
      {sheetOpen ? (
        <div
          className="fixed inset-0 z-40 bg-[oklch(0.24_0.02_60/0.4)] backdrop-blur-[2px] md:hidden"
          onClick={() => setSheetOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      {/* Quick add sheet */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 rounded-t-[26px] bg-card p-5 pb-8 shadow-[0_-16px_40px_-20px_rgba(80,60,40,0.5)] transition-transform duration-300 md:hidden ${
          sheetOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-medium text-foreground">添加库存</h3>
          <button
            type="button"
            aria-label="关闭"
            onClick={() => setSheetOpen(false)}
            className="flex size-8 items-center justify-center rounded-full bg-secondary text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/stock-in?mode=scan"
            onClick={() => setSheetOpen(false)}
            className="flex flex-col items-start gap-2 rounded-2xl bg-background/70 p-4 text-left ring-1 ring-border transition-colors hover:bg-accent/60"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ScanLine className="size-5" strokeWidth={1.75} />
            </span>
            <span className="text-sm font-medium text-foreground">扫码入库</span>
            <span className="text-xs text-muted-foreground">识别商品条码</span>
          </Link>
          <Link
            href="/stock-in?mode=manual"
            onClick={() => setSheetOpen(false)}
            className="flex flex-col items-start gap-2 rounded-2xl bg-background/70 p-4 text-left ring-1 ring-border transition-colors hover:bg-accent/60"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-foreground">
              <PencilLine className="size-5" strokeWidth={1.75} />
            </span>
            <span className="text-sm font-medium text-foreground">手动入库</span>
            <span className="text-xs text-muted-foreground">填写商品信息</span>
          </Link>
        </div>
      </div>

      {/* Bottom navigation bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-card/90 backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around px-6 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2.5">
          <Link
            href="/"
            className={`flex w-16 flex-col items-center gap-1 py-1 transition-colors ${active === 'home' ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <Home className="size-5.5" strokeWidth={1.75} />
            <span className="text-[11px] font-medium">Home</span>
          </Link>

          <button
            type="button"
            aria-label="添加库存"
            onClick={() => setSheetOpen(true)}
            className="flex size-14 -translate-y-3 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_24px_-8px_rgba(80,60,40,0.6)] transition-transform active:scale-95"
          >
            <Plus className="size-6" strokeWidth={2} />
          </button>

          <Link
            href="/inventory"
            className={`flex w-16 flex-col items-center gap-1 py-1 transition-colors ${active === 'inventory' ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <Boxes className="size-5.5" strokeWidth={1.75} />
            <span className="text-[11px] font-medium">Inventory</span>
          </Link>
        </div>
      </nav>
    </>
  )
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-16 flex-col items-center gap-1 py-1 transition-colors ${
        active ? 'text-primary' : 'text-muted-foreground'
      }`}
    >
      {icon}
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  )
}
